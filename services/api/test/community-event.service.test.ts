import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { EventService } from '../src/community/event/event.service';

describe('EventService', () => {
  it('creates community events', async () => {
    const service = new EventService(
      {
        save(event: unknown) {
          return Promise.resolve(event);
        },
      } as never,
      {} as never,
      {
        assertAcceptable: () => undefined,
      } as never,
    );

    const result = await service.create({
      id: 'event-1',
      communityId: 'community-1',
      creatorId: 'user-1',
      title: 'Community Meeting',
      description: 'Local meeting',
      startsAt: new Date(),
      endsAt: new Date(),
      createdAt: new Date(),
    });

    assert.equal(result.title, 'Community Meeting');
  });
});
