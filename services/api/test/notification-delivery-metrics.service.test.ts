import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { NotificationDeliveryOutcome } from '../src/notification/metrics/notification-delivery-metrics.interface';
import { NotificationDeliveryMetricsService } from '../src/notification/metrics/notification-delivery-metrics.service';

describe('NotificationDeliveryMetricsService', () => {
  it('records every delivery outcome', () => {
    const service = new NotificationDeliveryMetricsService();

    service.record(NotificationDeliveryOutcome.REALTIME);
    service.record(NotificationDeliveryOutcome.REALTIME);
    service.record(NotificationDeliveryOutcome.PUSH);
    service.record(NotificationDeliveryOutcome.RETRY);
    service.record(NotificationDeliveryOutcome.FAILED);

    assert.deepEqual(service.snapshot(), {
      realtime: 2,
      push: 1,
      retryQueued: 1,
      failed: 1,
    });
  });

  it('resets counters', () => {
    const service = new NotificationDeliveryMetricsService();

    service.record(NotificationDeliveryOutcome.PUSH);
    service.reset();

    assert.deepEqual(service.snapshot(), {
      realtime: 0,
      push: 0,
      retryQueued: 0,
      failed: 0,
    });
  });
});
