import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';

import type { EventEntity } from './event.entity';
import { EventRepository } from './event.repository';

@Injectable()
export class PrismaEventRepository extends EventRepository {
  constructor(private readonly database: DatabaseService) {
    super();
  }

  private map(event: any): EventEntity {
    return {
      id: event.id,
      communityId: event.communityId,
      creatorId: event.creatorId,
      title: event.title,
      description: event.description,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      latitude:
        event.latitude === null || event.latitude === undefined ? null : Number(event.latitude),
      longitude:
        event.longitude === null || event.longitude === undefined ? null : Number(event.longitude),
      locationAccuracyM: event.locationAccuracyM ?? null,
      addressLine1: event.addressLine1 ?? null,
      addressLine2: event.addressLine2 ?? null,
      city: event.city ?? null,
      postcode: event.postcode ?? null,
      locationVisibility: event.locationVisibility,
      createdAt: event.createdAt,

      ...(event.community && {
        community: {
          id: event.community.id,
          name: event.community.name,
        },
      }),

      ...(event.creator && {
        creator: {
          id: event.creator.id,
          displayName: event.creator.displayName,
        },
      }),

      attendanceCount: event._count?.attendances ?? 0,
    };
  }

  async save(event: EventEntity): Promise<EventEntity> {
    const record = await this.database.event.create({
      data: {
        id: event.id,
        communityId: event.communityId,
        creatorId: event.creatorId,
        title: event.title,
        description: event.description,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        ...(event.latitude !== undefined ? { latitude: event.latitude } : {}),
        ...(event.longitude !== undefined ? { longitude: event.longitude } : {}),
        ...(event.locationAccuracyM !== undefined
          ? { locationAccuracyM: event.locationAccuracyM }
          : {}),
        ...(event.addressLine1 !== undefined ? { addressLine1: event.addressLine1 } : {}),
        ...(event.addressLine2 !== undefined ? { addressLine2: event.addressLine2 } : {}),
        ...(event.city !== undefined ? { city: event.city } : {}),
        ...(event.postcode !== undefined ? { postcode: event.postcode } : {}),
        ...(event.locationVisibility !== undefined
          ? { locationVisibility: event.locationVisibility }
          : {}),
      },
    });

    return this.map(record);
  }

  async findById(id: string): Promise<EventEntity | undefined> {
    const record = await this.database.event.findUnique({
      where: {
        id,
      },
      include: {
        community: true,
        creator: true,
        _count: {
          select: {
            attendances: true,
          },
        },
      },
    });

    return record ? this.map(record) : undefined;
  }

  async findByCommunity(communityId: string): Promise<EventEntity[]> {
    const records = await this.database.event.findMany({
      where: {
        communityId,
      },
      include: {
        community: true,
        creator: true,
        _count: {
          select: {
            attendances: true,
          },
        },
      },
      orderBy: {
        startsAt: 'asc',
      },
    });

    return records.map((record) => this.map(record));
  }

  async findForUser(userId: string): Promise<EventEntity[]> {
    const records = await this.database.event.findMany({
      where: {
        OR: [
          {
            creatorId: userId,
          },
          {
            community: {
              memberships: {
                some: {
                  userId,
                  status: 'ACTIVE',
                },
              },
            },
          },
        ],
      },
      include: {
        community: true,
        creator: true,
        _count: {
          select: {
            attendances: true,
          },
        },
      },
      orderBy: {
        startsAt: 'asc',
      },
    });

    return records.map((record) => this.map(record));
  }

  async remove(id: string): Promise<void> {
    await this.database.event.delete({
      where: {
        id,
      },
    });
  }
}
