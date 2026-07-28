import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ApnsConfigurationService } from '../src/notification/config/apns-configuration.service';
import { ApnsProviderTokenService } from '../src/notification/auth/apns-provider-token.service';

class TestConfigurationService extends ApnsConfigurationService {
  override load() {
    return {
      teamId: 'TEAM',
      keyId: 'KEY',
      bundleId: 'com.neighbour.app',
      privateKey: 'private-key',
      environment: 'development' as const,
      host: 'api.sandbox.push.apple.com',
      tokenLifetimeSeconds: 60,
      requestTimeoutMilliseconds: 5000,
    };
  }
}

describe('ApnsProviderTokenService', () => {
  it('caches tokens until expiry', () => {
    const service = new ApnsProviderTokenService(new TestConfigurationService());

    const now = new Date('2026-01-01T00:00:00Z');

    const first = service.getToken(now);
    const second = service.getToken(new Date(now.getTime() + 30000));

    assert.equal(first.token, second.token);
  });

  it('creates a new token after expiry', () => {
    const service = new ApnsProviderTokenService(new TestConfigurationService());

    const first = service.getToken(new Date('2026-01-01T00:00:00Z'));

    const second = service.getToken(new Date('2026-01-01T00:02:00Z'));

    assert.notEqual(first.token, second.token);
  });

  it('clears the cache', () => {
    const service = new ApnsProviderTokenService(new TestConfigurationService());

    service.getToken();
    service.clear();

    const token = service.getToken();

    assert.ok(token.token.length > 0);
  });
});
