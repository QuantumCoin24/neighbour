import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { NotificationDeliveryResultService } from '../src/notification/result/notification-delivery-result.service';

describe('NotificationDeliveryResultService', () => {
  it('records and retrieves delivery results', () => {
    const service = new NotificationDeliveryResultService();

    const now = new Date();

    service.record({
      id: 'notification-1',
      success: true,
      timestamp: now,
    });

    const result = service.get('notification-1');

    assert.equal(result?.success, true);
    assert.equal(result?.timestamp, now);
  });

  it('clears stored results', () => {
    const service = new NotificationDeliveryResultService();

    service.record({
      id: 'notification-1',
      success: false,
      timestamp: new Date(),
      reason: 'Expired',
    });

    service.clear('notification-1');

    assert.equal(service.get('notification-1'), undefined);
  });
});
