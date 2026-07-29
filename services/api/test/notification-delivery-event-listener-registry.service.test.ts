import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { NotificationDeliveryEventBusService } from '../src/notification/transport/notification-delivery-event-bus.service';
import { NotificationDeliveryEventListenerRegistryService } from '../src/notification/transport/notification-delivery-event-listener-registry.service';

describe('NotificationDeliveryEventListenerRegistryService', () => {
  it('registers listeners with the event bus', () => {
    const bus = new NotificationDeliveryEventBusService();
    const registry = new NotificationDeliveryEventListenerRegistryService(bus);

    let invoked = false;

    const unsubscribe = registry.register(() => {
      invoked = true;
    });

    bus.publish({
      provider: 'apns',
      success: true,
      endpoint: 'https://api.sandbox.push.apple.com/3/device/example',
      recordedAt: new Date('2026-01-01T12:00:00Z'),
    });

    assert.equal(invoked, true);

    unsubscribe();

    assert.equal(bus.subscriberCount(), 0);
  });
});
