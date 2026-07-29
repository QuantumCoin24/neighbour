import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { NotificationService } from '../src/notification/centre/notification.service';

describe('NotificationService', () => {
  it('creates notifications through repository', async () => {
    let stored: unknown;

    const repository = {
      save(notification: unknown) {
        stored = notification;
        return Promise.resolve(notification);
      },
      findByUser() {
        return Promise.resolve([]);
      },
      markRead() {
        return Promise.resolve(undefined);
      },
    };

    const service = new NotificationService(repository as never);

    await service.create({
      id: 'notification-1',
      userId: 'user-1',
      type: 'comment',
      title: 'New comment',
      message: 'Someone commented on your post',
      status: 'unread',
      createdAt: new Date(),
    });

    assert.ok(stored);
  });
});
