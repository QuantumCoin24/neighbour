import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ApnsErrorClassifierService } from '../src/notification/transport/apns-error-classifier.service';

describe('ApnsErrorClassifierService', () => {
  const service = new ApnsErrorClassifierService();

  it('classifies successful responses', () => {
    assert.equal(service.classify(200), 'success');
  });

  it('classifies permanent APNs failures', () => {
    assert.equal(service.classify(400, 'BadDeviceToken'), 'permanent');

    assert.equal(service.classify(410, 'Unregistered'), 'permanent');
  });

  it('classifies temporary APNs failures', () => {
    assert.equal(service.classify(429, 'TooManyRequests'), 'temporary');

    assert.equal(service.classify(503, 'ServiceUnavailable'), 'temporary');
  });

  it('returns unknown for unrecognised failures', () => {
    assert.equal(service.classify(418, 'SomethingUnexpected'), 'unknown');
  });
});
