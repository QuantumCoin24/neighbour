import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { NotificationDeliveryMetricsCollectorService } from '../src/notification/transport/notification-delivery-metrics-collector.service';
import { NotificationDeliveryMetricsSnapshotService } from '../src/notification/transport/notification-delivery-metrics-snapshot.service';

describe('NotificationDeliveryMetricsSnapshotService', () => {
  it('creates a metrics snapshot', () => {
    const collector = new NotificationDeliveryMetricsCollectorService();

    collector.record({
      provider: 'apns',
      success: true,
      endpoint: 'https://example.com/device/1',
      recordedAt: new Date(),
    });

    collector.record({
      provider: 'apns',
      success: false,
      endpoint: 'https://example.com/device/2',
      recordedAt: new Date(),
    });

    const service = new NotificationDeliveryMetricsSnapshotService(collector);

    assert.deepEqual(service.snapshot(), {
      total: 2,
      successful: 1,
      failed: 1,
      successRate: 0.5,
    });
  });
});
