import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { NotificationDeliveryOutcomeRecorderService } from '../src/notification/transport/notification-delivery-outcome-recorder.service';

describe('NotificationDeliveryOutcomeRecorderService', () => {
  it('records delivery outcomes with timestamps', () => {
    const service = new NotificationDeliveryOutcomeRecorderService();

    const before = Date.now();

    const record = service.record({
      success: true,
      provider: 'apns',
      endpoint: 'https://api.sandbox.push.apple.com/3/device/example',
      retryable: false,
    });

    const after = Date.now();

    assert.equal(record.success, true);
    assert.equal(record.provider, 'apns');
    assert.equal(record.retryable, false);
    assert.equal(record.endpoint, 'https://api.sandbox.push.apple.com/3/device/example');

    assert.ok(record.recordedAt instanceof Date);
    assert.ok(record.recordedAt.getTime() >= before);
    assert.ok(record.recordedAt.getTime() <= after);
  });
});
