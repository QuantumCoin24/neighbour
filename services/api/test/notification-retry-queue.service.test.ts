import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { NotificationRetryQueueService } from '../src/notification/queue/notification-retry-queue.service';

describe('NotificationRetryQueueService', () => {
  it('stores retry jobs', () => {
    const queue = new NotificationRetryQueueService();

    queue.enqueue({
      recipientId: 'user-1',
      deviceId: 'device-1',
      attempt: 1,
      scheduledAt: new Date(),
      payload: {
        aps: {
          alert: {
            title: 'Neighbour',
            body: 'Retry',
          },
        },
      },
    });

    assert.equal(queue.size(), 1);
  });

  it('returns jobs FIFO', () => {
    const queue = new NotificationRetryQueueService();

    const first = queue.enqueue({
      recipientId: 'user-1',
      deviceId: 'device-1',
      attempt: 1,
      scheduledAt: new Date(),
      payload: {
        aps: {
          alert: {
            title: 'A',
            body: 'A',
          },
        },
      },
    });

    queue.enqueue({
      recipientId: 'user-2',
      deviceId: 'device-2',
      attempt: 1,
      scheduledAt: new Date(),
      payload: {
        aps: {
          alert: {
            title: 'B',
            body: 'B',
          },
        },
      },
    });

    assert.equal(queue.dequeue()?.id, first.id);
    assert.equal(queue.size(), 1);
  });

  it('returns null when empty', () => {
    const queue = new NotificationRetryQueueService();

    assert.equal(queue.dequeue(), null);
  });
});
