import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../database/database.service';
import {
  AdventureScope,
  LocationVisibility,
  MembershipRole,
  MembershipStatus,
  TrailScope,
} from '../generated/prisma/client.js';
import type { CreateAdventureDto } from './dto/create-adventure.dto';
import type { UpdateAdventureDto } from './dto/update-adventure.dto';
import type { AdventureEntity, AdventureStageEntity } from './adventure.entity';
import { AdventureRepository } from './adventure.repository';

@Injectable()
export class AdventureService {
  constructor(
    private readonly repository: AdventureRepository,
    private readonly database: DatabaseService,
  ) {}

  private validateScope(
    scope: AdventureScope,
    communityId: string | null,
    visibility: LocationVisibility,
  ) {
    if (scope === AdventureScope.PERSONAL && communityId !== null) {
      throw new BadRequestException('Personal adventures cannot belong to a community.');
    }

    if (scope === AdventureScope.COMMUNITY && communityId === null) {
      throw new BadRequestException('Community adventures require a community.');
    }

    if (scope === AdventureScope.PERSONAL && visibility === LocationVisibility.COMMUNITY) {
      throw new BadRequestException('Personal adventures cannot use community visibility.');
    }

    if (scope === AdventureScope.COMMUNITY && visibility === LocationVisibility.PUBLIC) {
      throw new BadRequestException('Community adventures cannot be public.');
    }
  }

  private parseDate(value: string | undefined, field: string): Date | null {
    if (!value) return null;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${field} must be a valid date.`);
    }

    return date;
  }

  private validateLifecycle(startsAt: Date | null, expiresAt: Date | null) {
    if (startsAt && expiresAt && expiresAt <= startsAt) {
      throw new BadRequestException('Adventure expiry must be after its start time.');
    }
  }

  private validateStages(
    stages: Array<{
      position: number;
      latitude?: number;
      longitude?: number;
    }>,
  ) {
    const positions = stages.map((stage) => stage.position);

    if (new Set(positions).size !== positions.length) {
      throw new BadRequestException('Adventure stage positions must be unique.');
    }

    const ordered = [...positions].sort((a, b) => a - b);
    for (let index = 0; index < ordered.length; index += 1) {
      if (ordered[index] !== index) {
        throw new BadRequestException(
          'Adventure stage positions must start at 0 and be contiguous.',
        );
      }
    }

    for (const stage of stages) {
      const hasLatitude = stage.latitude !== undefined;
      const hasLongitude = stage.longitude !== undefined;
      if (hasLatitude !== hasLongitude) {
        throw new BadRequestException(
          'Adventure stage coordinates require both latitude and longitude.',
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
      select: { role: true },
    });

    if (!membership) {
      throw new ForbiddenException('Active community membership is required.');
    }

    return membership;
  }

  private async validateTrail(
    userId: string,
    scope: AdventureScope,
    communityId: string | null,
    trailId: string | null,
  ) {
    if (!trailId) return;

    const trail = await this.database.trail.findFirst({
      where: {
        id: trailId,
        deletedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: {
        creatorId: true,
        communityId: true,
        scope: true,
        visibility: true,
      },
    });

    if (!trail) {
      throw new BadRequestException('Linked trail must exist and remain active.');
    }

    if (scope === AdventureScope.PERSONAL) {
      const accessible =
        trail.creatorId === userId ||
        (trail.scope === TrailScope.PERSONAL && trail.visibility === LocationVisibility.PUBLIC);

      if (!accessible) {
        throw new ForbiddenException('Linked trail is not available to this personal adventure.');
      }

      return;
    }

    if (
      trail.scope !== TrailScope.COMMUNITY ||
      trail.communityId !== communityId ||
      trail.visibility !== LocationVisibility.COMMUNITY
    ) {
      throw new ForbiddenException(
        'Community adventures may only link a visible trail from the same community.',
      );
    }
  }

  private makeStages(
    adventureId: string,
    stages: Array<{
      position: number;
      type: any;
      title: string;
      description?: string;
      latitude?: number;
      longitude?: number;
    }>,
  ): AdventureStageEntity[] {
    const now = new Date();

    return stages.map((stage) => ({
      id: randomUUID(),
      adventureId,
      position: stage.position,
      type: stage.type,
      title: stage.title.trim(),
      description: stage.description?.trim() || null,
      latitude: stage.latitude ?? null,
      longitude: stage.longitude ?? null,
      createdAt: now,
      updatedAt: now,
    }));
  }

  async create(userId: string, dto: CreateAdventureDto): Promise<AdventureEntity> {
    const communityId = dto.communityId ?? null;
    const trailId = dto.trailId ?? null;

    this.validateScope(dto.scope, communityId, dto.visibility);
    this.validateStages(dto.stages);

    if (dto.scope === AdventureScope.COMMUNITY && communityId) {
      await this.requireActiveMembership(userId, communityId);
    }

    await this.validateTrail(userId, dto.scope, communityId, trailId);

    const startsAt = this.parseDate(dto.startsAt, 'startsAt');
    const expiresAt = this.parseDate(dto.expiresAt, 'expiresAt');
    this.validateLifecycle(startsAt, expiresAt);

    const id = randomUUID();
    const now = new Date();

    return this.repository.save({
      id,
      creatorId: userId,
      communityId,
      trailId,
      scope: dto.scope,
      category: dto.category,
      title: dto.title.trim(),
      description: dto.description.trim(),
      visibility: dto.visibility,
      estimatedMinutes: dto.estimatedMinutes ?? null,
      startsAt,
      expiresAt,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
      stages: this.makeStages(id, dto.stages),
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

  async update(userId: string, id: string, dto: UpdateAdventureDto): Promise<AdventureEntity> {
    const existing = await this.repository.findById(id);

    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Adventure not found.');
    }

    if (existing.creatorId !== userId) {
      throw new ForbiddenException('Only the adventure creator can edit this adventure.');
    }

    if (existing.scope === AdventureScope.COMMUNITY && existing.communityId) {
      await this.requireActiveMembership(userId, existing.communityId);
    }

    const visibility = dto.visibility ?? existing.visibility;
    this.validateScope(existing.scope, existing.communityId, visibility);

    const trailId = dto.trailId !== undefined ? dto.trailId : existing.trailId;
    await this.validateTrail(userId, existing.scope, existing.communityId, trailId);

    let stages = existing.stages;
    if (dto.stages) {
      this.validateStages(dto.stages);
      stages = this.makeStages(existing.id, dto.stages);
    }

    const startsAt =
      dto.startsAt !== undefined ? this.parseDate(dto.startsAt, 'startsAt') : existing.startsAt;
    const expiresAt =
      dto.expiresAt !== undefined ? this.parseDate(dto.expiresAt, 'expiresAt') : existing.expiresAt;

    this.validateLifecycle(startsAt, expiresAt);

    return this.repository.update({
      ...existing,
      trailId,
      category: dto.category ?? existing.category,
      title: dto.title?.trim() ?? existing.title,
      description: dto.description?.trim() ?? existing.description,
      visibility,
      estimatedMinutes:
        dto.estimatedMinutes !== undefined ? dto.estimatedMinutes : existing.estimatedMinutes,
      startsAt,
      expiresAt,
      updatedAt: new Date(),
      stages,
    });
  }

  async remove(userId: string, id: string) {
    const adventure = await this.repository.findById(id);

    if (!adventure || adventure.deletedAt) {
      throw new NotFoundException('Adventure not found.');
    }

    if (adventure.creatorId === userId) {
      await this.repository.softDelete(id);
      return { success: true };
    }

    if (adventure.scope !== AdventureScope.COMMUNITY || !adventure.communityId) {
      throw new ForbiddenException('You cannot remove this adventure.');
    }

    const membership = await this.requireActiveMembership(userId, adventure.communityId);
    const moderationRoles: MembershipRole[] = [
      MembershipRole.OWNER,
      MembershipRole.ADMIN,
      MembershipRole.MODERATOR,
    ];

    if (!moderationRoles.includes(membership.role)) {
      throw new ForbiddenException('You cannot remove this adventure.');
    }

    await this.repository.softDelete(id);
    return { success: true };
  }
}
