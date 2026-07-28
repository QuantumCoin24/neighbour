import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { AppleJwtBuilderService } from '../src/notification/auth/apple-jwt-builder.service';
import { ApnsConfigurationService } from '../src/notification/config/apns-configuration.service';

class TestConfigurationService extends ApnsConfigurationService {
  override load() {
    return {
      teamId: 'TEAM123',
      keyId: 'KEY123',
      bundleId: 'com.neighbour.app',
      privateKey: 'PRIVATEKEY',
      environment: 'development' as const,
      host: 'api.sandbox.push.apple.com',
      tokenLifetimeSeconds: 3600,
      requestTimeoutMilliseconds: 10000,
    };
  }
}

describe('AppleJwtBuilderService', () => {
  it('builds an Apple JWT payload', () => {
    const builder = new AppleJwtBuilderService(new TestConfigurationService());

    const jwt = builder.build(new Date('2026-01-01T00:00:00Z'));

    assert.deepEqual(jwt.header, {
      alg: 'ES256',
      kid: 'KEY123',
    });

    assert.deepEqual(jwt.claims, {
      iss: 'TEAM123',
      iat: 1767225600,
    });

    assert.equal(jwt.algorithm, 'ES256');
    assert.equal(jwt.privateKey, 'PRIVATEKEY');
  });
});
