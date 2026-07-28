import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { NotificationDeliveryStatisticsService } from '../src/notification/metrics/notification-delivery-statistics.service';

describe('NotificationDeliveryStatisticsService', () => {
  it('tracks delivery statistics', () => {
    const service = new NotificationDeliveryStatisticsService();

    service.markSent();
    service.markSent();
    service.markDelivered();
    service.markFailed();

    assert.deepEqual(service.snapshot(), {
      sent: 2,
      delivered: 1,
      failed: 1,
    });
  });

  it('resets statistics', () => {
    const service = new NotificationDeliveryStatisticsService();

    service.markSent();
    service.reset();

    assert.deepEqual(service.snapshot(), {
      sent: 0,
      delivered: 0,
      failed: 0,
    });
  });
});
