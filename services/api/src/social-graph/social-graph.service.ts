import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import type {
  ConnectionResponse,
  ConnectionProfileSummary,
  RelationshipStatusResponse,
  BlockResponse,
} from './interfaces/social-graph-response.interface';
import { createConnectionPair } from './utils/connection-pair.util';

const connectionUserInclude = {
  userA: {
    include: {
      profile: true,
    },
  },
  userB: {
    include: {
      profile: true,
    },
  },
} as const;

type ConnectionWithUsers = Awaited<ReturnType<DatabaseService['connection']['findFirst']>> & {
  userA?: {
    id: string;
    displayName: string;
    profile: {
      username: string;
      avatarUrl: string | null;
      localArea: string | null;
      showLocalArea: boolean;
    } | null;
  };
  userB?: {
    id: string;
    displayName: string;
    profile: {
      username: string;
      avatarUrl: string | null;
      localArea: string | null;
      showLocalArea: boolean;
    } | null;
  };
};

@Injectable()
export class SocialGraphService {
  constructor(
    @Inject(DatabaseService)
    private readonly database: DatabaseService,
  ) {}

  async sendRequest(currentUserId: string, targetUserId: string): Promise<ConnectionResponse> {
    this.assertDifferentUsers(currentUserId, targetUserId);

    await this.requireActiveUser(targetUserId);
    await this.assertNotBlockedEitherDirection(currentUserId, targetUserId);

    const pair = createConnectionPair(currentUserId, targetUserId);

    const existing = await this.database.connection.findUnique({
      where: {
        userAId_userBId: pair,
      },
      include: connectionUserInclude,
    });

    if (existing?.status === 'CONNECTED') {
      throw new ConflictException('You are already connected to this user.');
    }

    if (existing?.status === 'PENDING') {
      if (existing.requestedById === currentUserId) {
        throw new ConflictException('A connection request has already been sent.');
      }

      throw new ConflictException('This user has already sent you a connection request.');
    }

    const connection = existing
      ? await this.database.connection.update({
          where: {
            id: existing.id,
          },
          data: {
            requestedById: currentUserId,
            status: 'PENDING',
            respondedAt: null,
            connectedAt: null,
          },
          include: connectionUserInclude,
        })
      : await this.database.connection.create({
          data: {
            ...pair,
            requestedById: currentUserId,
            status: 'PENDING',
          },
          include: connectionUserInclude,
        });

    return this.toConnectionResponse(connection, currentUserId);
  }

  async acceptRequest(currentUserId: string, connectionId: string): Promise<ConnectionResponse> {
    const connection = await this.requireConnectionForUser(currentUserId, connectionId);

    if (connection.status !== 'PENDING') {
      throw new ConflictException('This connection request is no longer pending.');
    }

    if (connection.requestedById === currentUserId) {
      throw new ForbiddenException('You cannot accept a connection request that you sent.');
    }

    const otherUserId = this.getOtherUserId(currentUserId, connection);
    await this.assertNotBlockedEitherDirection(currentUserId, otherUserId);

    const accepted = await this.database.connection.update({
      where: {
        id: connectionId,
      },
      data: {
        status: 'CONNECTED',
        respondedAt: new Date(),
        connectedAt: new Date(),
      },
      include: connectionUserInclude,
    });

    return this.toConnectionResponse(accepted, currentUserId);
  }

  async declineRequest(currentUserId: string, connectionId: string): Promise<void> {
    const connection = await this.requireConnectionForUser(currentUserId, connectionId);

    if (connection.status !== 'PENDING') {
      throw new ConflictException('This connection request is no longer pending.');
    }

    if (connection.requestedById === currentUserId) {
      throw new ForbiddenException('Use the cancel endpoint for a request that you sent.');
    }

    await this.database.connection.update({
      where: {
        id: connectionId,
      },
      data: {
        status: 'DECLINED',
        respondedAt: new Date(),
        connectedAt: null,
      },
    });
  }

  async cancelRequest(currentUserId: string, connectionId: string): Promise<void> {
    const connection = await this.requireConnectionForUser(currentUserId, connectionId);

    if (connection.status !== 'PENDING') {
      throw new ConflictException('This connection request is no longer pending.');
    }

    if (connection.requestedById !== currentUserId) {
      throw new ForbiddenException('You cannot cancel a connection request sent by another user.');
    }

    await this.database.connection.delete({
      where: {
        id: connectionId,
      },
    });
  }

  async removeConnection(currentUserId: string, connectionId: string): Promise<void> {
    const connection = await this.requireConnectionForUser(currentUserId, connectionId);

    if (connection.status !== 'CONNECTED') {
      throw new ConflictException('This relationship is not an active connection.');
    }

    await this.database.connection.delete({
      where: {
        id: connectionId,
      },
    });
  }

  async listConnections(currentUserId: string): Promise<ConnectionResponse[]> {
    const connections = await this.database.connection.findMany({
      where: {
        status: 'CONNECTED',
        OR: [{ userAId: currentUserId }, { userBId: currentUserId }],
      },
      include: connectionUserInclude,
      orderBy: {
        connectedAt: 'desc',
      },
    });

    return connections.map((connection) => this.toConnectionResponse(connection, currentUserId));
  }

  async listIncomingRequests(currentUserId: string): Promise<ConnectionResponse[]> {
    const connections = await this.database.connection.findMany({
      where: {
        status: 'PENDING',
        requestedById: {
          not: currentUserId,
        },
        OR: [{ userAId: currentUserId }, { userBId: currentUserId }],
      },
      include: connectionUserInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return connections.map((connection) => this.toConnectionResponse(connection, currentUserId));
  }

  async listOutgoingRequests(currentUserId: string): Promise<ConnectionResponse[]> {
    const connections = await this.database.connection.findMany({
      where: {
        status: 'PENDING',
        requestedById: currentUserId,
      },
      include: connectionUserInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return connections.map((connection) => this.toConnectionResponse(connection, currentUserId));
  }

  async getRelationshipStatus(
    currentUserId: string,
    targetUserId: string,
  ): Promise<RelationshipStatusResponse> {
    this.assertDifferentUsers(currentUserId, targetUserId);

    await this.requireActiveUser(targetUserId);

    const blockedByMe = await this.database.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: currentUserId,
          blockedId: targetUserId,
        },
      },
    });

    if (blockedByMe) {
      return {
        userId: targetUserId,
        status: 'BLOCKED_BY_ME',
        connectionId: null,
      };
    }

    const blockedMe = await this.database.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: targetUserId,
          blockedId: currentUserId,
        },
      },
    });

    if (blockedMe) {
      return {
        userId: targetUserId,
        status: 'BLOCKED_ME',
        connectionId: null,
      };
    }

    const pair = createConnectionPair(currentUserId, targetUserId);

    const connection = await this.database.connection.findUnique({
      where: {
        userAId_userBId: pair,
      },
    });

    if (!connection || connection.status === 'DECLINED') {
      return {
        userId: targetUserId,
        status: 'NONE',
        connectionId: null,
      };
    }

    if (connection.status === 'CONNECTED') {
      return {
        userId: targetUserId,
        status: 'CONNECTED',
        connectionId: connection.id,
      };
    }

    return {
      userId: targetUserId,
      status: connection.requestedById === currentUserId ? 'OUTGOING_REQUEST' : 'INCOMING_REQUEST',
      connectionId: connection.id,
    };
  }

  async blockUser(currentUserId: string, targetUserId: string): Promise<BlockResponse> {
    this.assertDifferentUsers(currentUserId, targetUserId);
    await this.requireActiveUser(targetUserId);

    const pair = createConnectionPair(currentUserId, targetUserId);

    await this.database.$transaction([
      this.database.connection.deleteMany({
        where: {
          userAId: pair.userAId,
          userBId: pair.userBId,
        },
      }),
      this.database.userBlock.upsert({
        where: {
          blockerId_blockedId: {
            blockerId: currentUserId,
            blockedId: targetUserId,
          },
        },
        update: {},
        create: {
          blockerId: currentUserId,
          blockedId: targetUserId,
        },
      }),
    ]);

    return {
      blocked: true,
      userId: targetUserId,
    };
  }

  async unblockUser(currentUserId: string, targetUserId: string): Promise<BlockResponse> {
    this.assertDifferentUsers(currentUserId, targetUserId);

    await this.database.userBlock.deleteMany({
      where: {
        blockerId: currentUserId,
        blockedId: targetUserId,
      },
    });

    return {
      blocked: false,
      userId: targetUserId,
    };
  }

  private async requireActiveUser(userId: string): Promise<void> {
    const user = await this.database.user.findFirst({
      where: {
        id: userId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }
  }

  private async assertNotBlockedEitherDirection(
    firstUserId: string,
    secondUserId: string,
  ): Promise<void> {
    const block = await this.database.userBlock.findFirst({
      where: {
        OR: [
          {
            blockerId: firstUserId,
            blockedId: secondUserId,
          },
          {
            blockerId: secondUserId,
            blockedId: firstUserId,
          },
        ],
      },
      select: {
        id: true,
      },
    });

    if (block) {
      throw new ForbiddenException('A connection cannot be created between these users.');
    }
  }

  private async requireConnectionForUser(currentUserId: string, connectionId: string) {
    const connection = await this.database.connection.findFirst({
      where: {
        id: connectionId,
        OR: [{ userAId: currentUserId }, { userBId: currentUserId }],
      },
      include: connectionUserInclude,
    });

    if (!connection) {
      throw new NotFoundException('Connection not found.');
    }

    return connection;
  }

  private toConnectionResponse(
    connection: NonNullable<ConnectionWithUsers>,
    currentUserId: string,
  ): ConnectionResponse {
    if (!connection.userA || !connection.userB) {
      throw new Error('Connection user data was not loaded.');
    }

    const otherUser = connection.userAId === currentUserId ? connection.userB : connection.userA;

    let direction: ConnectionResponse['direction'] = 'CONNECTED';

    if (connection.status === 'PENDING') {
      direction = connection.requestedById === currentUserId ? 'OUTGOING' : 'INCOMING';
    }

    return {
      id: connection.id,
      status: connection.status,
      direction,
      user: this.toProfileSummary(otherUser),
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt,
      connectedAt: connection.connectedAt,
    };
  }

  private toProfileSummary(user: {
    id: string;
    displayName: string;
    profile: {
      username: string;
      avatarUrl: string | null;
      localArea: string | null;
      showLocalArea: boolean;
    } | null;
  }): ConnectionProfileSummary {
    return {
      id: user.id,
      displayName: user.displayName,
      username: user.profile?.username ?? null,
      avatarUrl: user.profile?.avatarUrl ?? null,
      localArea: user.profile?.showLocalArea === true ? user.profile.localArea : null,
    };
  }

  private getOtherUserId(
    currentUserId: string,
    connection: {
      userAId: string;
      userBId: string;
    },
  ): string {
    return connection.userAId === currentUserId ? connection.userBId : connection.userAId;
  }

  private assertDifferentUsers(currentUserId: string, targetUserId: string): void {
    if (currentUserId === targetUserId) {
      throw new BadRequestException('You cannot perform this action on your own account.');
    }
  }
}
