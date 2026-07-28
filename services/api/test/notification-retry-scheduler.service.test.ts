import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { NotificationRetryQueueService } from '../src/notification/queue/notification-retry-queue.service';
import { NotificationRetrySchedulerService } from '../src/notification/scheduler/notification-retry-scheduler.service';

describe('NotificationRetrySchedulerService', () => {
  it('processes jobs ready for delivery', () => {
    const queue = new NotificationRetryQueueService();

    queue.enqueue({
      recipientId: 'user',
      deviceId: 'device',
      attempt: 1,
      scheduledAt: new Date(Date.now() - 1000),
      payload: {
        aps: {
          alert: {
            title: 'Neighbour',
            body: 'Retry',
          },
        },
      },
    });

    const scheduler = new NotificationRetrySchedulerService(queue);

    assert.equal(scheduler.processReadyJobs(new Date()), 1);

    assert.equal(queue.size(), 0);
  });

  it('leaves future jobs queued', () => {
    const queue = new NotificationRetryQueueService();

    queue.enqueue({
      recipientId: 'user',
      deviceId: 'device',
      attempt: 1,
      scheduledAt: new Date(Date.now() + 60000),
      payload: {
        aps: {
          alert: {
            title: 'Neighbour',
            body: 'Retry',
          },
        },
      },
    });

    const scheduler = new NotificationRetrySchedulerService(queue);

    assert.equal(scheduler.processReadyJobs(new Date()), 0);

    assert.equal(queue.size(), 1);
  });
});
