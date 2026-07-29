import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { NotificationDeliveryEventSubscriberService } from '../src/notification/transport/notification-delivery-event-subscriber.service';

describe('NotificationDeliveryEventSubscriberService', () => {
  it('stores received audit events', () => {
    const service = new NotificationDeliveryEventSubscriberService();

    const event = {
      provider: 'apns',
      success: true,
      endpoint: 'https://api.sandbox.push.apple.com/3/device/example',
      recordedAt: new Date('2026-01-01T12:00:00Z'),
    };

    service.receive(event);

    assert.deepEqual(service.getReceivedEvents(), [event]);

    service.clear();

    assert.deepEqual(service.getReceivedEvents(), []);
  });
});
