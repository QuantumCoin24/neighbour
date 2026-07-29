import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { NotificationController } from '../src/notification/centre/notification.controller';

describe('NotificationController', () => {
  it('returns notifications for a user', async () => {
    const controller = new NotificationController({
      listForUser() {
        return Promise.resolve([
          {
            id: 'notification-1',
            userId: 'user-1',
          },
        ]);
      },
      markRead() {
        return Promise.resolve();
      },
    } as never);

    const result = await controller.list('user-1');

    assert.equal(result.length, 1);
  });

  it('marks notification as read', async () => {
    const controller = new NotificationController({
      listForUser() {
        return Promise.resolve([]);
      },
      markRead(id: string) {
        return Promise.resolve({
          id,
        });
      },
    } as never);

    const result = await controller.markRead('notification-1');

    assert.equal(result.id, 'notification-1');
  });
});
