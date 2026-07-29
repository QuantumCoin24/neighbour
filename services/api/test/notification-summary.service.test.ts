import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { NotificationSummaryService } from '../src/notification/centre/notification-summary.service';

describe('NotificationSummaryService', () => {
  it('returns notification totals', async () => {
    const service = new NotificationSummaryService({
      findByUser() {
        return Promise.resolve([
          {
            id: '1',
            status: 'unread',
          },
          {
            id: '2',
            status: 'read',
          },
        ]);
      },
    } as never);

    const result = await service.summary('user-1');

    assert.deepEqual(result, {
      total: 2,
      unread: 1,
    });
  });
});
