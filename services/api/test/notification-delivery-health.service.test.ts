import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { NotificationDeliveryHealthService } from '../src/notification/health/notification-delivery-health.service';

describe('NotificationDeliveryHealthService', () => {
  it('starts healthy', () => {
    const service = new NotificationDeliveryHealthService();

    assert.equal(service.status().healthy, true);
  });

  it('records failures and recovery', () => {
    const service = new NotificationDeliveryHealthService();

    service.markFailure();
    assert.equal(service.status().healthy, false);
    assert.ok(service.status().lastFailure instanceof Date);

    service.markHealthy();
    assert.deepEqual(service.status(), {
      healthy: true,
    });
  });
});
