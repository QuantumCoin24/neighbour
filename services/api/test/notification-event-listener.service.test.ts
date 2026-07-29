import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { NotificationEventBusService } from '../src/notification/centre/notification-event-bus.service';
import { NotificationEventListenerService } from '../src/notification/centre/notification-event-listener.service';

describe('NotificationEventListenerService', () => {
  it('creates notification from application event', () => {
    const bus = new NotificationEventBusService();

    let created = false;

    const listener = new NotificationEventListenerService(bus, {
      create() {
        created = true;
        return Promise.resolve();
      },
    } as never);

    listener.onModuleInit();

    bus.publish({
      type: 'notification.created',
      id: 'notification-1',
      userId: 'user-1',
      notificationType: 'comment',
      title: 'New comment',
      message: 'Someone commented',
    });

    assert.equal(created, true);
  });
});
