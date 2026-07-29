import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { NotificationDeliveryMetricsCollectorService } from '../src/notification/transport/notification-delivery-metrics-collector.service';
import { NotificationDeliveryEventBusService } from '../src/notification/transport/notification-delivery-event-bus.service';
import { NotificationDeliveryEventListenerRegistryService } from '../src/notification/transport/notification-delivery-event-listener-registry.service';
import { NotificationDeliveryMetricsListenerService } from '../src/notification/transport/notification-delivery-metrics-listener.service';

describe('NotificationDeliveryMetricsListenerService', () => {
  it('records events received through the listener registry', () => {
    const bus = new NotificationDeliveryEventBusService();
    const registry = new NotificationDeliveryEventListenerRegistryService(bus);

    const metrics = new NotificationDeliveryMetricsCollectorService();

    const listener = new NotificationDeliveryMetricsListenerService(registry, metrics);

    listener.onModuleInit();

    bus.publish({
      provider: 'apns',
      success: true,
      endpoint: 'https://example.com/device/1',
      recordedAt: new Date(),
    });

    assert.deepEqual(metrics.getMetrics(), {
      total: 1,
      successful: 1,
      failed: 0,
    });
  });
});
