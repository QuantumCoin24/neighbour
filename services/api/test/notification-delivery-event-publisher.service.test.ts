import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { NotificationDeliveryEventPublisherService } from '../src/notification/transport/notification-delivery-event-publisher.service';

describe('NotificationDeliveryEventPublisherService', () => {
  it('publishes and stores audit events', () => {
    const service = new NotificationDeliveryEventPublisherService();

    const event = {
      provider: 'apns',
      success: true,
      endpoint: 'https://api.sandbox.push.apple.com/3/device/example',
      recordedAt: new Date('2026-01-01T12:00:00Z'),
    };

    service.publish(event);

    assert.deepEqual(service.getPublishedEvents(), [event]);

    service.clear();

    assert.deepEqual(service.getPublishedEvents(), []);
  });
});
