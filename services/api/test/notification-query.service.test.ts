import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { NotificationQueryService } from '../src/notification/centre/notification-query.service';

describe('NotificationQueryService', () => {
  it('sorts newest notifications first', async () => {
    const service = new NotificationQueryService({
      findByUser() {
        return Promise.resolve([
          {
            id: 'old',
            status: 'unread',
            createdAt: new Date('2026-01-01'),
          },
          {
            id: 'new',
            status: 'unread',
            createdAt: new Date('2026-01-02'),
          },
        ]);
      },
    } as never);

    const result = await service.inbox('user-1');

    assert.ok(result[0]);
    assert.equal(result[0].id, 'new');
  });
});
