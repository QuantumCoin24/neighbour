import { Injectable } from '@nestjs/common';

import type { EventEntity } from './event.entity';

import { EventRepository } from './event.repository';

@Injectable()
export class EventService {
  constructor(private readonly repository: EventRepository) {}

  create(event: EventEntity): Promise<EventEntity> {
    return this.repository.save(event);
  }

  findCommunityEvents(communityId: string): Promise<EventEntity[]> {
    return this.repository.findByCommunity(communityId);
  }

  findById(id: string): Promise<EventEntity | undefined> {
    return this.repository.findById(id);
  }

  remove(id: string): Promise<void> {
    return this.repository.remove(id);
  }
}
