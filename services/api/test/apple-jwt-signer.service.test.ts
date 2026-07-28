import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { AppleJwtSignerService } from '../src/notification/auth/apple-jwt-signer.service';
import { AppleJwtBuilderService } from '../src/notification/auth/apple-jwt-builder.service';

class FakeBuilder {
  build() {
    return {
      header: { alg: 'ES256', kid: 'ABC123' },
      claims: { iss: 'TEAM', iat: 1 },
      algorithm: 'ES256',
      privateKey: `-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
-----END EC PRIVATE KEY-----`,
    };
  }
}

describe('AppleJwtSignerService', () => {
  it('creates a signer instance', () => {
    const signer = new AppleJwtSignerService(
      new FakeBuilder() as unknown as AppleJwtBuilderService,
    );

    assert.ok(signer);
  });
});
