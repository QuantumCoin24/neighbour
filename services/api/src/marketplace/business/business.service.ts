import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { MembershipStatus } from '../../generated/prisma/client.js';

import { DatabaseService } from '../../database/database.service';

import type { BusinessEntity } from './business.entity';

import { BusinessRepository } from './business.repository';

@Injectable()
export class BusinessService {
  constructor(
    private readonly repository: BusinessRepository,
    private readonly database: DatabaseService,
  ) {}

  async create(userId: string, business: BusinessEntity): Promise<BusinessEntity> {
    const community = await this.database.community.findUnique({
      where: {
        id: business.communityId,
      },
      select: {
        id: true,
        allowBusinesses: true,
      },
    });

    if (!community) {
      throw new NotFoundException('Community not found.');
    }

    if (!community.allowBusinesses) {
      throw new ForbiddenException('Business listings are not enabled for this community.');
    }

    const membership = await this.database.membership.findUnique({
      where: {
        userId_communityId: {
          userId,
          communityId: community.id,
        },
      },
      select: {
        status: true,
      },
    });

    if (!membership || membership.status !== MembershipStatus.ACTIVE) {
      throw new ForbiddenException(
        'You must be an active community member to create a business listing.',
      );
    }

    return this.repository.save(business);
  }

  findCommunityBusinesses(communityId: string): Promise<BusinessEntity[]> {
    return this.repository.findByCommunity(communityId);
  }

  findById(id: string): Promise<BusinessEntity | undefined> {
    return this.repository.findById(id);
  }

  findByOwner(ownerId: string): Promise<BusinessEntity | undefined> {
    return this.repository.findByOwner(ownerId);
  }

  search(query: string): Promise<BusinessEntity[]> {
    return this.repository.search(query);
  }

  async update(
    userId: string,
    id: string,
    data: {
      name?: string;
      description?: string;
      category?: string;
    },
  ): Promise<BusinessEntity> {
    const business = await this.repository.findById(id);

    if (!business) {
      throw new NotFoundException('Business not found.');
    }

    if (business.ownerId !== userId) {
      throw new ForbiddenException('You do not have permission to update this business.');
    }

    return this.repository.update(id, data);
  }

  async remove(userId: string, id: string): Promise<void> {
    const business = await this.repository.findById(id);

    if (!business) {
      throw new NotFoundException('Business not found.');
    }

    if (business.ownerId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this business.');
    }

    await this.repository.remove(id);
  }
}
