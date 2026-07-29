import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ApnsRetryPolicyService } from '../src/notification/transport/apns-retry-policy.service';

describe('ApnsRetryPolicyService', () => {
  const service = new ApnsRetryPolicyService();

  it('retries temporary failures', () => {
    assert.equal(service.shouldRetry('temporary', 0), true);

    assert.equal(service.shouldRetry('temporary', 2), true);

    assert.equal(service.shouldRetry('temporary', 3), false);
  });

  it('never retries permanent failures', () => {
    assert.equal(service.shouldRetry('permanent', 0), false);

    assert.equal(service.shouldRetry('unknown', 0), false);

    assert.equal(service.shouldRetry('success', 0), false);
  });

  it('uses exponential backoff', () => {
    assert.equal(service.nextDelayMilliseconds(0), 1000);

    assert.equal(service.nextDelayMilliseconds(1), 2000);

    assert.equal(service.nextDelayMilliseconds(2), 4000);
  });
});
