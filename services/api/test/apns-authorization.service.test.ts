import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ApnsAuthorizationService } from '../src/notification/auth/apns-authorization.service';
import { AppleJwtSignerService } from '../src/notification/auth/apple-jwt-signer.service';

class FakeSigner {
  sign() {
    return 'signed.jwt.token';
  }
}

describe('ApnsAuthorizationService', () => {
  it('creates a bearer authorization header', () => {
    const service = new ApnsAuthorizationService(
      new FakeSigner() as unknown as AppleJwtSignerService,
    );

    assert.equal(service.createAuthorizationHeader(), 'bearer signed.jwt.token');
  });
});
