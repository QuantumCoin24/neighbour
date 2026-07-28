import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ApnsTransportErrorClassifierService } from '../src/notification/transport/apns-transport-error-classifier.service';

describe('ApnsTransportErrorClassifierService', () => {
  it('classifies successful responses', () => {
    const service = new ApnsTransportErrorClassifierService();

    assert.deepEqual(service.classify(200), {
      category: 'success',
      invalidateToken: false,
    });
  });

  it('classifies permanent failures', () => {
    const service = new ApnsTransportErrorClassifierService();

    assert.deepEqual(service.classify(410), {
      category: 'permanent',
      invalidateToken: true,
    });
  });

  it('classifies retryable failures', () => {
    const service = new ApnsTransportErrorClassifierService();

    assert.deepEqual(service.classify(500), {
      category: 'retryable',
      invalidateToken: false,
    });
  });
});
