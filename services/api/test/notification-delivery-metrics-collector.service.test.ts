import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { NotificationDeliveryMetricsCollectorService } from '../src/notification/transport/notification-delivery-metrics-collector.service';

describe('NotificationDeliveryMetricsCollectorService', () => {
  it('tracks delivery outcomes', () => {
    const service = new NotificationDeliveryMetricsCollectorService();

    service.record({
      provider: 'apns',
      success: true,
      endpoint: 'https://example.com/device/1',
      recordedAt: new Date(),
    });

    service.record({
      provider: 'apns',
      success: false,
      endpoint: 'https://example.com/device/2',
      recordedAt: new Date(),
    });

    assert.deepEqual(service.getMetrics(), {
      total: 2,
      successful: 1,
      failed: 1,
    });
  });

  it('resets metrics', () => {
    const service = new NotificationDeliveryMetricsCollectorService();

    service.record({
      provider: 'apns',
      success: true,
      endpoint: 'https://example.com/device/1',
      recordedAt: new Date(),
    });

    service.reset();

    assert.deepEqual(service.getMetrics(), {
      total: 0,
      successful: 0,
      failed: 0,
    });
  });
});
