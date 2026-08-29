import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { LocationVisibility, MapDiscoveryScope } from '../generated/prisma/client.js';
import type { MapDiscoveryEntity } from './map-discovery.entity';
import { MapDiscoveryRepository } from './map-discovery.repository';

@Injectable()
export class PrismaMapDiscoveryRepository extends MapDiscoveryRepository {
  constructor(private readonly database: DatabaseService) {
    super();
  }

  private map(record: any): MapDiscoveryEntity {
    return {
      id: record.id,
      creatorId: record.creatorId,
      communityId: record.communityId ?? null,
      scope: record.scope,
      type: record.type,
      category: record.category,
      title: record.title,
      description: record.description,
      latitude: Number(record.latitude),
      longitude: Number(record.longitude),
      locationAccuracyM: record.locationAccuracyM ?? null,
      visibility: record.visibility,
      startsAt: record.startsAt ?? null,
      expiresAt: record.expiresAt ?? null,
      deletedAt: record.deletedAt ?? null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
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
    } as const;
  }

  private activeWhere() {
    return {
      deletedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    };
  }

  async save(discovery: MapDiscoveryEntity): Promise<MapDiscoveryEntity> {
    const record = await this.database.mapDiscovery.create({
      data: {
        id: discovery.id,
        creatorId: discovery.creatorId,
        communityId: discovery.communityId,
        scope: discovery.scope,
        type: discovery.type,
        category: discovery.category,
        title: discovery.title,
        description: discovery.description,
        latitude: discovery.latitude,
        longitude: discovery.longitude,
        locationAccuracyM: discovery.locationAccuracyM,
        visibility: discovery.visibility,
        startsAt: discovery.startsAt,
        expiresAt: discovery.expiresAt,
        deletedAt: discovery.deletedAt,
        createdAt: discovery.createdAt,
      },
      include: this.include(),
    });

    return this.map(record);
  }

  async findById(id: string): Promise<MapDiscoveryEntity | undefined> {
    const record = await this.database.mapDiscovery.findUnique({
      where: { id },
      include: this.include(),
    });

    return record ? this.map(record) : undefined;
  }

  async findMine(creatorId: string): Promise<MapDiscoveryEntity[]> {
    const records = await this.database.mapDiscovery.findMany({
      where: {
        creatorId,
        ...this.activeWhere(),
      },
      orderBy: { createdAt: 'desc' },
      include: this.include(),
    });

    return records.map((record) => this.map(record));
  }

  async findPublicPersonalByUsername(username: string): Promise<MapDiscoveryEntity[]> {
    const profile = await this.database.userProfile.findUnique({
      where: { username },
      select: { userId: true },
    });

    if (!profile) {
      return [];
    }

    const records = await this.database.mapDiscovery.findMany({
      where: {
        creatorId: profile.userId,
        scope: MapDiscoveryScope.PERSONAL,
        visibility: LocationVisibility.PUBLIC,
        ...this.activeWhere(),
      },
      orderBy: { createdAt: 'desc' },
      include: this.include(),
    });

    return records.map((record) => this.map(record));
  }

  async findCommunity(communityId: string): Promise<MapDiscoveryEntity[]> {
    const records = await this.database.mapDiscovery.findMany({
      where: {
        communityId,
        scope: MapDiscoveryScope.COMMUNITY,
        ...this.activeWhere(),
      },
      orderBy: { createdAt: 'desc' },
      include: this.include(),
    });

    return records.map((record) => this.map(record));
  }

  async softDelete(id: string): Promise<void> {
    await this.database.mapDiscovery.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
