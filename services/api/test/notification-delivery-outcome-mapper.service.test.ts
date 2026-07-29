import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { NotificationDeliveryOutcomeMapperService } from '../src/notification/transport/notification-delivery-outcome-mapper.service';

describe('NotificationDeliveryOutcomeMapperService', () => {
  it('maps APNs transport results into delivery outcomes', () => {
    const service = new NotificationDeliveryOutcomeMapperService();

    const outcome = service.map({
      status: 200,
      accepted: true,
      endpoint: 'https://api.sandbox.push.apple.com/3/device/example',
      classification: 'success',
      retryable: false,
    });

    assert.deepEqual(outcome, {
      success: true,
      provider: 'apns',
      endpoint: 'https://api.sandbox.push.apple.com/3/device/example',
      retryable: false,
    });
  });
});
