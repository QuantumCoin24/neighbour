import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AccessToken } from 'livekit-server-sdk';

import {
  LiveModerationEventType,
  LiveParticipantRole,
  LiveSessionStatus,
  Prisma,
} from '../generated/prisma/client';
import { ContentSafetyService } from '../common/content-safety/content-safety.service';
import { DatabaseService } from '../database/database.service';
import { VibesService } from '../vibes/vibes.service';
import type { CreateLiveSessionDto } from './dto/create-live-session.dto';
import type {
  LiveAccessResponse,
  LiveParticipantRoleResponse,
  LiveSessionResponse,
} from './interfaces/live-response.interface';

const liveInclude = {
  creator: {
    select: {
      id: true,
      displayName: true,
      profile: {
        select: {
          avatarUrl: true,
        },
      },
    },
  },
  participants: {
    where: {
      leftAt: null,
      removedAt: null,
    },
    select: {
      id: true,
      userId: true,
      role: true,
    },
  },
} satisfies Prisma.LiveSessionInclude;

type LiveWithRelations = Prisma.LiveSessionGetPayload<{
  include: typeof liveInclude;
}>;

@Injectable()
export class LiveService {
  constructor(
    private readonly database: DatabaseService,
    private readonly vibesService: VibesService,
    private readonly contentSafety: ContentSafetyService,
  ) {}

  async create(currentUserId: string, dto: CreateLiveSessionDto): Promise<LiveSessionResponse> {
    this.contentSafety.assertAcceptable(
      { field: 'title', value: dto.title },
      { field: 'description', value: dto.description },
    );

    await this.requireNoActiveHostSession(currentUserId);

    const session = await this.database.$transaction(async (tx) => {
      const created = await tx.liveSession.create({
        data: {
          creatorId: currentUserId,
          communityId: dto.communityId ?? null,
          neighbourhoodId: dto.neighbourhoodId ?? null,
          title: dto.title?.trim() || null,
          description: dto.description?.trim() || null,
          status: LiveSessionStatus.STARTING,
          provider: 'livekit',
        },
      });

      const roomName = `neighbour-live-${created.id}`;

      await tx.liveSession.update({
        where: { id: created.id },
        data: {
          providerRoomName: roomName,
        },
      });

      await tx.liveParticipant.create({
        data: {
          liveSessionId: created.id,
          userId: currentUserId,
          role: LiveParticipantRole.HOST,
        },
      });

      return created.id;
    });

    return this.findOne(currentUserId, session);
  }

  async findOne(currentUserId: string, liveSessionId: string): Promise<LiveSessionResponse> {
    const session = await this.requireVisibleSession(currentUserId, liveSessionId);

    return this.toResponse(session);
  }

  async active(currentUserId: string): Promise<LiveSessionResponse[]> {
    const sessions = await this.database.liveSession.findMany({
      where: {
        status: {
          in: [LiveSessionStatus.STARTING, LiveSessionStatus.LIVE],
        },
      },
      include: liveInclude,
      orderBy: [{ startedAt: 'desc' }, { createdAt: 'desc' }],
      take: 50,
    });

    const visible: LiveSessionResponse[] = [];

    for (const session of sessions) {
      if (await this.canView(currentUserId, session)) {
        visible.push(this.toResponse(session));
      }
    }

    return visible;
  }

  async access(currentUserId: string, liveSessionId: string): Promise<LiveAccessResponse> {
    const session = await this.requireVisibleSession(currentUserId, liveSessionId);

    if (
      session.status !== LiveSessionStatus.STARTING &&
      session.status !== LiveSessionStatus.LIVE
    ) {
      throw new BadRequestException('This live session is not active.');
    }

    const roomName = session.providerRoomName;

    if (!roomName) {
      throw new ServiceUnavailableException('This live session does not have a media room.');
    }

    const role =
      session.creatorId === currentUserId ? LiveParticipantRole.HOST : LiveParticipantRole.VIEWER;

    await this.ensureParticipant(liveSessionId, currentUserId, role);

    return {
      session: await this.findOne(currentUserId, liveSessionId),
      provider: 'livekit',
      roomName,
      serverUrl: this.requireLiveKitUrl(),
      token: await this.createAccessToken(currentUserId, roomName, role),
      role: role as LiveParticipantRoleResponse,
    };
  }

  async markLive(currentUserId: string, liveSessionId: string): Promise<LiveSessionResponse> {
    const session = await this.requireOwnedSession(currentUserId, liveSessionId);

    if (
      session.status !== LiveSessionStatus.STARTING &&
      session.status !== LiveSessionStatus.LIVE
    ) {
      throw new BadRequestException('Only a starting live session can go live.');
    }

    if (session.status !== LiveSessionStatus.LIVE) {
      await this.database.liveSession.update({
        where: { id: liveSessionId },
        data: {
          status: LiveSessionStatus.LIVE,
          startedAt: session.startedAt ?? new Date(),
        },
      });
    }

    return this.findOne(currentUserId, liveSessionId);
  }

  async leave(currentUserId: string, liveSessionId: string): Promise<void> {
    const participant = await this.database.liveParticipant.findFirst({
      where: {
        liveSessionId,
        userId: currentUserId,
        leftAt: null,
        removedAt: null,
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });

    if (!participant) {
      return;
    }

    await this.database.liveParticipant.update({
      where: {
        id: participant.id,
      },
      data: {
        leftAt: new Date(),
      },
    });
  }

  async end(currentUserId: string, liveSessionId: string): Promise<LiveSessionResponse> {
    const session = await this.requireOwnedSession(currentUserId, liveSessionId);

    if (
      session.status === LiveSessionStatus.ENDED ||
      session.status === LiveSessionStatus.CANCELLED
    ) {
      return this.findOne(currentUserId, liveSessionId);
    }

    await this.database.$transaction(async (tx) => {
      await tx.liveSession.update({
        where: {
          id: liveSessionId,
        },
        data: {
          status: LiveSessionStatus.ENDED,
          endedAt: new Date(),
        },
      });

      await tx.liveParticipant.updateMany({
        where: {
          liveSessionId,
          leftAt: null,
        },
        data: {
          leftAt: new Date(),
        },
      });

      await tx.liveModerationEvent.create({
        data: {
          liveSessionId,
          actorId: currentUserId,
          type: LiveModerationEventType.STREAM_ENDED,
          reason: 'Host ended stream.',
        },
      });
    });

    return this.findOne(currentUserId, liveSessionId);
  }

  private async createAccessToken(
    userId: string,
    roomName: string,
    role: LiveParticipantRole,
  ): Promise<string> {
    const apiKey = process.env.LIVEKIT_API_KEY?.trim();
    const apiSecret = process.env.LIVEKIT_API_SECRET?.trim();

    if (!apiKey || !apiSecret) {
      throw new ServiceUnavailableException('Live broadcasting is not configured.');
    }

    const token = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      ttl: '2h',
      metadata: JSON.stringify({
        neighbourRole: role,
      }),
    });

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canSubscribe: true,
      canPublish: role === LiveParticipantRole.HOST,
      canPublishData: true,
    });

    return token.toJwt();
  }

  private requireLiveKitUrl(): string {
    const value = process.env.LIVEKIT_URL?.trim();

    if (!value) {
      throw new ServiceUnavailableException('Live broadcasting is not configured.');
    }

    return value;
  }

  private async ensureParticipant(
    liveSessionId: string,
    userId: string,
    role: LiveParticipantRole,
  ): Promise<void> {
    const existing = await this.database.liveParticipant.findFirst({
      where: {
        liveSessionId,
        userId,
        leftAt: null,
        removedAt: null,
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });

    if (existing) {
      if (existing.role !== role) {
        await this.database.liveParticipant.update({
          where: { id: existing.id },
          data: { role },
        });
      }

      return;
    }

    await this.database.liveParticipant.create({
      data: {
        liveSessionId,
        userId,
        role,
      },
    });
  }

  private async requireOwnedSession(currentUserId: string, liveSessionId: string) {
    const session = await this.database.liveSession.findFirst({
      where: {
        id: liveSessionId,
        creatorId: currentUserId,
      },
    });

    if (!session) {
      throw new NotFoundException('Live session not found.');
    }

    return session;
  }

  private async requireVisibleSession(
    currentUserId: string,
    liveSessionId: string,
  ): Promise<LiveWithRelations> {
    const session = await this.database.liveSession.findUnique({
      where: {
        id: liveSessionId,
      },
      include: liveInclude,
    });

    if (!session || !(await this.canView(currentUserId, session))) {
      throw new NotFoundException('Live session not found.');
    }

    return session;
  }
  private async canView(currentUserId: string, session: LiveWithRelations): Promise<boolean> {
    if (session.creatorId === currentUserId) {
      return true;
    }

    if (
      session.status !== LiveSessionStatus.STARTING &&
      session.status !== LiveSessionStatus.LIVE
    ) {
      return false;
    }

    return this.vibesService.canViewAudience(currentUserId, {
      creatorId: session.creatorId,
      communityId: session.communityId,
      neighbourhoodId: session.neighbourhoodId,
    });
  }

  private async requireNoActiveHostSession(currentUserId: string): Promise<void> {
    const active = await this.database.liveSession.findFirst({
      where: {
        creatorId: currentUserId,
        status: {
          in: [LiveSessionStatus.STARTING, LiveSessionStatus.LIVE],
        },
      },
      select: {
        id: true,
      },
    });

    if (active) {
      throw new BadRequestException('You already have an active live session.');
    }
  }

  private toResponse(session: LiveWithRelations): LiveSessionResponse {
    return {
      id: session.id,
      creatorId: session.creatorId,
      communityId: session.communityId,
      neighbourhoodId: session.neighbourhoodId,
      title: session.title,
      description: session.description,
      status: session.status,
      provider: session.provider,
      providerRoomName: session.providerRoomName,
      scheduledAt: session.scheduledAt?.toISOString() ?? null,
      startedAt: session.startedAt?.toISOString() ?? null,
      endedAt: session.endedAt?.toISOString() ?? null,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      creator: {
        id: session.creator.id,
        displayName: session.creator.displayName,
        avatarUrl: session.creator.profile?.avatarUrl ?? null,
      },
      viewerCount: session.participants.filter(
        (participant) => participant.role === LiveParticipantRole.VIEWER,
      ).length,
    };
  }
}
