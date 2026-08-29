import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../database/database.service';
import {
  LocationVisibility,
  MembershipRole,
  MembershipStatus,
  TrailScope,
} from '../generated/prisma/client.js';
import type { CreateTrailDto } from './dto/create-trail.dto';
import type { UpdateTrailDto } from './dto/update-trail.dto';
import type { TrailCheckpointEntity, TrailEntity } from './trail.entity';
import { TrailRepository } from './trail.repository';

@Injectable()
export class TrailService {
  constructor(
    private readonly repository: TrailRepository,
    private readonly database: DatabaseService,
  ) {}

  private validateScope(
    scope: TrailScope,
    communityId: string | null,
    visibility: LocationVisibility,
  ) {
    if (scope === TrailScope.PERSONAL && communityId !== null) {
      throw new BadRequestException('Personal trails cannot belong to a community.');
    }

    if (scope === TrailScope.COMMUNITY && communityId === null) {
      throw new BadRequestException('Community trails require a community.');
    }

    if (scope === TrailScope.PERSONAL && visibility === LocationVisibility.COMMUNITY) {
      throw new BadRequestException('Personal trails cannot use community visibility.');
    }

    if (scope === TrailScope.COMMUNITY && visibility === LocationVisibility.PUBLIC) {
      throw new BadRequestException('Community trails cannot be public.');
    }
  }

  private parseDate(value: string | undefined, field: string): Date | null {
    if (!value) {
      return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${field} must be a valid date.`);
    }

    return date;
  }

  private validateLifecycle(startsAt: Date | null, expiresAt: Date | null) {
    if (startsAt && expiresAt && expiresAt <= startsAt) {
      throw new BadRequestException('Trail expiry must be after its start time.');
    }
  }

  private validateCheckpoints(
    checkpoints: Array<{
      position: number;
      mapDiscoveryId?: string;
    }>,
  ) {
    const positions = checkpoints.map((checkpoint) => checkpoint.position);
    if (new Set(positions).size !== positions.length) {
      throw new BadRequestException('Trail checkpoint positions must be unique.');
    }

    const ordered = [...positions].sort((a, b) => a - b);
    for (let index = 0; index < ordered.length; index += 1) {
      if (ordered[index] !== index) {
        throw new BadRequestException(
          'Trail checkpoint positions must start at 0 and be contiguous.',
        );
      }
    }
  }

  private async requireActiveMembership(userId: string, communityId: string) {
    const membership = await this.database.membership.findFirst({
      where: {
        userId,
        communityId,
        status: MembershipStatus.ACTIVE,
      },
      select: {
        role: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Active community membership is required.');
    }

    return membership;
  }

  private async validateDiscoveryLinks(
    userId: string,
    scope: TrailScope,
    communityId: string | null,
    checkpoints: Array<{ mapDiscoveryId?: string }>,
  ) {
    const ids = [
      ...new Set(
        checkpoints
          .map((checkpoint) => checkpoint.mapDiscoveryId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    if (ids.length === 0) {
      return;
    }

    const discoveries = await this.database.mapDiscovery.findMany({
      where: {
        id: { in: ids },
        deletedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: {
        id: true,
        creatorId: true,
        communityId: true,
        scope: true,
        visibility: true,
      },
    });

    if (discoveries.length !== ids.length) {
      throw new BadRequestException('Every linked discovery must exist and remain active.');
    }

    for (const discovery of discoveries) {
      if (scope === TrailScope.PERSONAL) {
        const accessible =
          discovery.creatorId === userId ||
          (discovery.scope === 'PERSONAL' && discovery.visibility === LocationVisibility.PUBLIC);

        if (!accessible) {
          throw new ForbiddenException(
            'A linked discovery is not available to this personal trail.',
          );
        }
      } else if (discovery.scope !== 'COMMUNITY' || discovery.communityId !== communityId) {
        throw new ForbiddenException(
          'Community trails may only link discoveries from the same community.',
        );
      }
    }
  }

  private makeCheckpoints(
    trailId: string,
    checkpoints: Array<{
      mapDiscoveryId?: string;
      position: number;
      title?: string;
      instruction?: string;
      latitude: number;
      longitude: number;
    }>,
  ): TrailCheckpointEntity[] {
    const now = new Date();

    return checkpoints.map((checkpoint) => ({
      id: randomUUID(),
      trailId,
      mapDiscoveryId: checkpoint.mapDiscoveryId ?? null,
      position: checkpoint.position,
      title: checkpoint.title?.trim() || null,
      instruction: checkpoint.instruction?.trim() || null,
      latitude: checkpoint.latitude,
      longitude: checkpoint.longitude,
      createdAt: now,
      updatedAt: now,
    }));
  }

  async create(userId: string, dto: CreateTrailDto): Promise<TrailEntity> {
    const communityId = dto.communityId ?? null;
    this.validateScope(dto.scope, communityId, dto.visibility);
    this.validateCheckpoints(dto.checkpoints);

    if (dto.scope === TrailScope.COMMUNITY && communityId) {
      await this.requireActiveMembership(userId, communityId);
    }

    await this.validateDiscoveryLinks(userId, dto.scope, communityId, dto.checkpoints);

    const startsAt = this.parseDate(dto.startsAt, 'startsAt');
    const expiresAt = this.parseDate(dto.expiresAt, 'expiresAt');
    this.validateLifecycle(startsAt, expiresAt);

    const id = randomUUID();
    const now = new Date();

    return this.repository.save({
      id,
      creatorId: userId,
      communityId,
      scope: dto.scope,
      category: dto.category,
      title: dto.title.trim(),
      description: dto.description.trim(),
      visibility: dto.visibility,
      distanceM: dto.distanceM ?? null,
      estimatedMinutes: dto.estimatedMinutes ?? null,
      startsAt,
      expiresAt,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
      checkpoints: this.makeCheckpoints(id, dto.checkpoints),
    });
  }

  findMine(userId: string) {
    return this.repository.findMine(userId);
  }

  findPublicProfile(username: string) {
    return this.repository.findPublicPersonalByUsername(username);
  }

  async findCommunity(userId: string, communityId: string) {
    await this.requireActiveMembership(userId, communityId);
    return this.repository.findCommunity(communityId, userId);
  }

  async update(userId: string, id: string, dto: UpdateTrailDto): Promise<TrailEntity> {
    const existing = await this.repository.findById(id);

    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Trail not found.');
    }

    if (existing.creatorId !== userId) {
      throw new ForbiddenException('Only the trail creator can edit this trail.');
    }

    if (existing.scope === TrailScope.COMMUNITY && existing.communityId) {
      await this.requireActiveMembership(userId, existing.communityId);
    }

    const visibility = dto.visibility ?? existing.visibility;
    this.validateScope(existing.scope, existing.communityId, visibility);

    let checkpoints: TrailCheckpointEntity[] = existing.checkpoints;

    if (dto.checkpoints) {
      this.validateCheckpoints(dto.checkpoints);
      await this.validateDiscoveryLinks(
        userId,
        existing.scope,
        existing.communityId,
        dto.checkpoints,
      );
      checkpoints = this.makeCheckpoints(existing.id, dto.checkpoints);
    }

    const startsAt =
      dto.startsAt !== undefined ? this.parseDate(dto.startsAt, 'startsAt') : existing.startsAt;
    const expiresAt =
      dto.expiresAt !== undefined ? this.parseDate(dto.expiresAt, 'expiresAt') : existing.expiresAt;

    this.validateLifecycle(startsAt, expiresAt);

    return this.repository.update({
      ...existing,
      category: dto.category ?? existing.category,
      title: dto.title?.trim() ?? existing.title,
      description: dto.description?.trim() ?? existing.description,
      visibility,
      distanceM: dto.distanceM !== undefined ? dto.distanceM : existing.distanceM,
      estimatedMinutes:
        dto.estimatedMinutes !== undefined ? dto.estimatedMinutes : existing.estimatedMinutes,
      startsAt,
      expiresAt,
      updatedAt: new Date(),
      checkpoints,
    });
  }

  async remove(userId: string, id: string) {
    const trail = await this.repository.findById(id);

    if (!trail || trail.deletedAt) {
      throw new NotFoundException('Trail not found.');
    }

    if (trail.creatorId === userId) {
      await this.repository.softDelete(id);
      return { success: true };
    }

    if (trail.scope !== TrailScope.COMMUNITY || !trail.communityId) {
      throw new ForbiddenException('You cannot remove this trail.');
    }

    const membership = await this.requireActiveMembership(userId, trail.communityId);

    const moderationRoles: MembershipRole[] = [
      MembershipRole.OWNER,
      MembershipRole.ADMIN,
      MembershipRole.MODERATOR,
    ];
    const canModerate = moderationRoles.includes(membership.role);

    if (!canModerate) {
      throw new ForbiddenException('You cannot remove this trail.');
    }

    await this.repository.softDelete(id);
    return { success: true };
  }
}
