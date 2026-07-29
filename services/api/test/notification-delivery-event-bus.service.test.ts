import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { NotificationDeliveryEventBusService } from '../src/notification/transport/notification-delivery-event-bus.service';

describe('NotificationDeliveryEventBusService', () => {
  it('publishes events to all subscribers', () => {
    const bus = new NotificationDeliveryEventBusService();

    const received: string[] = [];

    const unsubscribe = bus.subscribe((event) => {
      received.push(event.provider);
    });

    assert.equal(bus.subscriberCount(), 1);

    bus.publish({
      provider: 'apns',
      success: true,
      endpoint: 'https://api.sandbox.push.apple.com/3/device/example',
      recordedAt: new Date('2026-01-01T12:00:00Z'),
    });

    assert.deepEqual(received, ['apns']);

    unsubscribe();

    assert.equal(bus.subscriberCount(), 0);
  });
});
