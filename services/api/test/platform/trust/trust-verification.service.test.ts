import assert from 'node:assert/strict';

import { describe, it } from 'node:test';

import { TrustVerificationService } from '../../../src/platform/trust/trust-verification.service';

describe('TrustVerificationService', () => {
  it('verifies ready trust states', () => {
    const service = new TrustVerificationService();

    const result = service.verify({
      domain: 'community',

      identity: 'VERIFIED',

      permissions: 'VALID',

      safety: 'PASSED',

      status: 'READY',
    });

    assert.equal(result.verified, true);
  });
});
