import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { NotificationDeliveryAuditMapperService } from '../src/notification/transport/notification-delivery-audit-mapper.service';

describe('NotificationDeliveryAuditMapperService', () => {
  it('maps delivery records into audit events', () => {
    const service = new NotificationDeliveryAuditMapperService();

    const recordedAt = new Date('2026-01-01T12:00:00Z');

    const audit = service.map({
      success: true,
      provider: 'apns',
      endpoint: 'https://api.sandbox.push.apple.com/3/device/example',
      retryable: false,
      recordedAt,
    });

    assert.deepEqual(audit, {
      provider: 'apns',
      success: true,
      endpoint: 'https://api.sandbox.push.apple.com/3/device/example',
      recordedAt,
    });
  });
});
