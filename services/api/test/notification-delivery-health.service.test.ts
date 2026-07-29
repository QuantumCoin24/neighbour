import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { NotificationDeliveryHealthService } from '../src/notification/transport/notification-delivery-health.service';

describe('NotificationDeliveryHealthService', () => {
  it('returns healthy delivery status', () => {
    const service = new NotificationDeliveryHealthService({
      snapshot: () => ({
        total: 10,
        successful: 10,
        failed: 0,
        successRate: 1,
      }),
    } as never);

    assert.deepEqual(service.check(), {
      status: 'healthy',
      successRate: 1,
    });
  });

  it('returns failing status for poor delivery rates', () => {
    const service = new NotificationDeliveryHealthService({
      snapshot: () => ({
        total: 10,
        successful: 2,
        failed: 8,
        successRate: 0.2,
      }),
    } as never);

    assert.deepEqual(service.check(), {
      status: 'failing',
      successRate: 0.2,
    });
  });
});
