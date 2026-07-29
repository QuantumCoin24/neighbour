import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { NotificationDeliveryEventBusService } from '../src/notification/transport/notification-delivery-event-bus.service';
import { NotificationDeliveryEventDispatcherService } from '../src/notification/transport/notification-delivery-event-dispatcher.service';

describe('NotificationDeliveryEventDispatcherService', () => {
  it('dispatches events through the event bus', () => {
    const bus = new NotificationDeliveryEventBusService();
    const dispatcher = new NotificationDeliveryEventDispatcherService(bus);

    let received = false;

    bus.subscribe(() => {
      received = true;
    });

    dispatcher.dispatch({
      provider: 'apns',
      success: true,
      endpoint: 'https://api.sandbox.push.apple.com/3/device/example',
      recordedAt: new Date('2026-01-01T12:00:00Z'),
    });

    assert.equal(received, true);
  });
});
