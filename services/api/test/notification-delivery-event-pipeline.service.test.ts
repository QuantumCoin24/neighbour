import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { NotificationDeliveryEventBusService } from '../src/notification/transport/notification-delivery-event-bus.service';
import { NotificationDeliveryEventDispatcherService } from '../src/notification/transport/notification-delivery-event-dispatcher.service';
import { NotificationDeliveryEventListenerRegistryService } from '../src/notification/transport/notification-delivery-event-listener-registry.service';
import { NotificationDeliveryEventPipelineService } from '../src/notification/transport/notification-delivery-event-pipeline.service';

describe('NotificationDeliveryEventPipelineService', () => {
  it('publishes events to registered listeners', () => {
    const bus = new NotificationDeliveryEventBusService();
    const dispatcher = new NotificationDeliveryEventDispatcherService(bus);
    const registry = new NotificationDeliveryEventListenerRegistryService(bus);
    const pipeline = new NotificationDeliveryEventPipelineService(dispatcher, registry);

    let invoked = false;

    pipeline.register(() => {
      invoked = true;
    });

    pipeline.publish({
      provider: 'apns',
      success: true,
      endpoint: 'https://api.sandbox.push.apple.com/3/device/example',
      recordedAt: new Date('2026-01-01T12:00:00Z'),
    });

    assert.equal(invoked, true);
  });
});
