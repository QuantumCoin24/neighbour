import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AdventureScope, LocationVisibility } from '../generated/prisma/client.js';
import type { AdventureEntity } from './adventure.entity';
import { AdventureRepository } from './adventure.repository';

@Injectable()
export class PrismaAdventureRepository extends AdventureRepository {
  constructor(private readonly database: DatabaseService) {
    super();
  }

  private include() {
    return {
      creator: {
        select: {
          id: true,
          displayName: true,
          profile: { select: { username: true } },
        },
      },
      community: {
        select: { id: true, name: true, slug: true },
      },
      trail: {
        select: {
          id: true,
          creatorId: true,
          communityId: true,
          title: true,
          scope: true,
          visibility: true,
        },
      },
      stages: {
        orderBy: { position: 'asc' as const },
      },
    } as const;
  }

  private activeWhere() {
    return {
      deletedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    };
  }

  private map(record: any): AdventureEntity {
    return {
      id: record.id,
      creatorId: record.creatorId,
      communityId: record.communityId ?? null,
      trailId: record.trailId ?? null,
      scope: record.scope,
      category: record.category,
      title: record.title,
      description: record.description,
      visibility: record.visibility,
      estimatedMinutes: record.estimatedMinutes ?? null,
      startsAt: record.startsAt ?? null,
      expiresAt: record.expiresAt ?? null,
      deletedAt: record.deletedAt ?? null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      stages: record.stages.map((stage: any) => ({
        id: stage.id,
        adventureId: stage.adventureId,
        position: stage.position,
        type: stage.type,
        title: stage.title,
        description: stage.description ?? null,
        latitude: stage.latitude === null ? null : Number(stage.latitude),
        longitude: stage.longitude === null ? null : Number(stage.longitude),
        createdAt: stage.createdAt,
        updatedAt: stage.updatedAt,
      })),
      ...(record.creator && {
        creator: {
          id: record.creator.id,
          displayName: record.creator.displayName,
          username: record.creator.profile?.username ?? null,
        },
      }),
      community: record.community
        ? {
            id: record.community.id,
            name: record.community.name,
            slug: record.community.slug,
          }
        : null,
      trail: record.trail
        ? {
            id: record.trail.id,
            creatorId: record.trail.creatorId,
            communityId: record.trail.communityId ?? null,
            title: record.trail.title,
            scope: record.trail.scope,
            visibility: record.trail.visibility,
          }
        : null,
    };
  }

  async save(adventure: AdventureEntity): Promise<AdventureEntity> {
    const record = await this.database.adventure.create({
      data: {
        id: adventure.id,
        creatorId: adventure.creatorId,
        communityId: adventure.communityId,
        trailId: adventure.trailId,
        scope: adventure.scope,
        category: adventure.category,
        title: adventure.title,
        description: adventure.description,
        visibility: adventure.visibility,
        estimatedMinutes: adventure.estimatedMinutes,
        startsAt: adventure.startsAt,
        expiresAt: adventure.expiresAt,
        deletedAt: adventure.deletedAt,
        createdAt: adventure.createdAt,
        stages: {
          create: adventure.stages.map((stage) => ({
            id: stage.id,
            position: stage.position,
            type: stage.type,
            title: stage.title,
            description: stage.description,
            latitude: stage.latitude,
            longitude: stage.longitude,
            createdAt: stage.createdAt,
          })),
        },
      },
      include: this.include(),
    });

    return this.map(record);
  }

  async findById(id: string): Promise<AdventureEntity | undefined> {
    const record = await this.database.adventure.findUnique({
      where: { id },
      include: this.include(),
    });
    return record ? this.map(record) : undefined;
  }

  async findMine(creatorId: string): Promise<AdventureEntity[]> {
    const records = await this.database.adventure.findMany({
      where: {
        creatorId,
        ...this.activeWhere(),
      },
      orderBy: { createdAt: 'desc' },
      include: this.include(),
    });
    return records.map((record) => this.map(record));
  }

  async findPublicPersonalByUsername(username: string): Promise<AdventureEntity[]> {
    const profile = await this.database.userProfile.findUnique({
      where: { username },
      select: { userId: true },
    });

    if (!profile) return [];

    const records = await this.database.adventure.findMany({
      where: {
        creatorId: profile.userId,
        scope: AdventureScope.PERSONAL,
        visibility: LocationVisibility.PUBLIC,
        ...this.activeWhere(),
      },
      orderBy: { createdAt: 'desc' },
      include: this.include(),
    });

    return records.map((record) => this.map(record));
  }

  async findCommunity(communityId: string, requesterId: string): Promise<AdventureEntity[]> {
    const records = await this.database.adventure.findMany({
      where: {
        communityId,
        scope: AdventureScope.COMMUNITY,
        deletedAt: null,
        AND: [
          {
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          {
            OR: [{ visibility: LocationVisibility.COMMUNITY }, { creatorId: requesterId }],
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: this.include(),
    });

    return records.map((record) => this.map(record));
  }

  async update(adventure: AdventureEntity): Promise<AdventureEntity> {
    return this.database.$transaction(async (database) => {
      await database.adventureStage.deleteMany({
        where: { adventureId: adventure.id },
      });

      const record = await database.adventure.update({
        where: { id: adventure.id },
        data: {
          trailId: adventure.trailId,
          category: adventure.category,
          title: adventure.title,
          description: adventure.description,
          visibility: adventure.visibility,
          estimatedMinutes: adventure.estimatedMinutes,
          startsAt: adventure.startsAt,
          expiresAt: adventure.expiresAt,
          stages: {
            create: adventure.stages.map((stage) => ({
              id: stage.id,
              position: stage.position,
              type: stage.type,
              title: stage.title,
              description: stage.description,
              latitude: stage.latitude,
              longitude: stage.longitude,
              createdAt: stage.createdAt,
            })),
          },
        },
        include: this.include(),
      });

      return this.map(record);
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.database.adventure.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
