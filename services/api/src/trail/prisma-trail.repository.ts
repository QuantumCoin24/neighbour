import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { LocationVisibility, TrailScope } from '../generated/prisma/client.js';
import type { TrailEntity } from './trail.entity';
import { TrailRepository } from './trail.repository';

@Injectable()
export class PrismaTrailRepository extends TrailRepository {
  constructor(private readonly database: DatabaseService) {
    super();
  }

  private include() {
    return {
      creator: {
        select: {
          id: true,
          displayName: true,
          profile: {
            select: {
              username: true,
            },
          },
        },
      },
      community: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      checkpoints: {
        orderBy: {
          position: 'asc' as const,
        },
      },
    } as const;
  }

  private activeWhere() {
    return {
      deletedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    };
  }

  private map(record: any): TrailEntity {
    return {
      id: record.id,
      creatorId: record.creatorId,
      communityId: record.communityId ?? null,
      scope: record.scope,
      category: record.category,
      title: record.title,
      description: record.description,
      visibility: record.visibility,
      distanceM: record.distanceM ?? null,
      estimatedMinutes: record.estimatedMinutes ?? null,
      startsAt: record.startsAt ?? null,
      expiresAt: record.expiresAt ?? null,
      deletedAt: record.deletedAt ?? null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      checkpoints: record.checkpoints.map((checkpoint: any) => ({
        id: checkpoint.id,
        trailId: checkpoint.trailId,
        mapDiscoveryId: checkpoint.mapDiscoveryId ?? null,
        position: checkpoint.position,
        title: checkpoint.title ?? null,
        instruction: checkpoint.instruction ?? null,
        latitude: Number(checkpoint.latitude),
        longitude: Number(checkpoint.longitude),
        createdAt: checkpoint.createdAt,
        updatedAt: checkpoint.updatedAt,
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
    };
  }

  async save(trail: TrailEntity): Promise<TrailEntity> {
    const record = await this.database.trail.create({
      data: {
        id: trail.id,
        creatorId: trail.creatorId,
        communityId: trail.communityId,
        scope: trail.scope,
        category: trail.category,
        title: trail.title,
        description: trail.description,
        visibility: trail.visibility,
        distanceM: trail.distanceM,
        estimatedMinutes: trail.estimatedMinutes,
        startsAt: trail.startsAt,
        expiresAt: trail.expiresAt,
        deletedAt: trail.deletedAt,
        createdAt: trail.createdAt,
        checkpoints: {
          create: trail.checkpoints.map((checkpoint) => ({
            id: checkpoint.id,
            mapDiscoveryId: checkpoint.mapDiscoveryId,
            position: checkpoint.position,
            title: checkpoint.title,
            instruction: checkpoint.instruction,
            latitude: checkpoint.latitude,
            longitude: checkpoint.longitude,
            createdAt: checkpoint.createdAt,
          })),
        },
      },
      include: this.include(),
    });

    return this.map(record);
  }

  async findById(id: string): Promise<TrailEntity | undefined> {
    const record = await this.database.trail.findUnique({
      where: { id },
      include: this.include(),
    });

    return record ? this.map(record) : undefined;
  }

  async findMine(creatorId: string): Promise<TrailEntity[]> {
    const records = await this.database.trail.findMany({
      where: {
        creatorId,
        ...this.activeWhere(),
      },
      orderBy: { createdAt: 'desc' },
      include: this.include(),
    });

    return records.map((record) => this.map(record));
  }

  async findPublicPersonalByUsername(username: string): Promise<TrailEntity[]> {
    const profile = await this.database.userProfile.findUnique({
      where: { username },
      select: { userId: true },
    });

    if (!profile) {
      return [];
    }

    const records = await this.database.trail.findMany({
      where: {
        creatorId: profile.userId,
        scope: TrailScope.PERSONAL,
        visibility: LocationVisibility.PUBLIC,
        ...this.activeWhere(),
      },
      orderBy: { createdAt: 'desc' },
      include: this.include(),
    });

    return records.map((record) => this.map(record));
  }

  async findCommunity(communityId: string): Promise<TrailEntity[]> {
    const records = await this.database.trail.findMany({
      where: {
        communityId,
        scope: TrailScope.COMMUNITY,
        ...this.activeWhere(),
      },
      orderBy: { createdAt: 'desc' },
      include: this.include(),
    });

    return records.map((record) => this.map(record));
  }

  async update(trail: TrailEntity): Promise<TrailEntity> {
    return this.database.$transaction(async (database) => {
      await database.trailCheckpoint.deleteMany({
        where: { trailId: trail.id },
      });

      const record = await database.trail.update({
        where: { id: trail.id },
        data: {
          category: trail.category,
          title: trail.title,
          description: trail.description,
          visibility: trail.visibility,
          distanceM: trail.distanceM,
          estimatedMinutes: trail.estimatedMinutes,
          startsAt: trail.startsAt,
          expiresAt: trail.expiresAt,
          checkpoints: {
            create: trail.checkpoints.map((checkpoint) => ({
              id: checkpoint.id,
              mapDiscoveryId: checkpoint.mapDiscoveryId,
              position: checkpoint.position,
              title: checkpoint.title,
              instruction: checkpoint.instruction,
              latitude: checkpoint.latitude,
              longitude: checkpoint.longitude,
              createdAt: checkpoint.createdAt,
            })),
          },
        },
        include: this.include(),
      });

      return this.map(record);
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.database.trail.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
