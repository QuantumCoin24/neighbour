import type { EventEntity } from './event.entity';

export abstract class EventRepository {
  abstract save(event: EventEntity): Promise<EventEntity>;

  abstract findById(id: string): Promise<EventEntity | undefined>;

  abstract findByCommunity(communityId: string): Promise<EventEntity[]>;

  abstract findForUser(userId: string): Promise<EventEntity[]>;

  abstract remove(id: string): Promise<void>;
}
