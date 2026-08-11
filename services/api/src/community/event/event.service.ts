import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MembershipRole, MembershipStatus } from '../../generated/prisma/client.js';

import { DatabaseService } from '../../database/database.service';

import type { EventEntity } from './event.entity';

import { EventRepository } from './event.repository';

@Injectable()
export class EventService {
  constructor(
    private readonly repository: EventRepository,
    private readonly database: DatabaseService,
  ) {}

  create(event: EventEntity): Promise<EventEntity> {
    return this.repository.save(event);
  }

  findCommunityEvents(communityId: string): Promise<EventEntity[]> {
    return this.repository.findByCommunity(communityId);
  }

  findForUser(userId: string): Promise<EventEntity[]> {
    return this.repository.findForUser(userId);
  }

  findById(id: string): Promise<EventEntity | undefined> {
    return this.repository.findById(id);
  }

  async remove(userId: string, id: string): Promise<void> {
    const event = await this.repository.findById(id);

    if (!event) {
      throw new NotFoundException('Event not found.');
    }

    if (event.creatorId === userId) {
      await this.repository.remove(id);
      return;
    }

    const membership = await this.database.membership.findFirst({
      where: {
        userId,
        communityId: event.communityId,
        status: MembershipStatus.ACTIVE,
        role: {
          in: [MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MODERATOR],
        },
      },
      select: {
        id: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You do not have permission to delete this event.');
    }

    await this.repository.remove(id);
  }
}
