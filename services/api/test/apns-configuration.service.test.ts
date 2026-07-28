import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ApnsConfigurationService } from '../src/notification/config/apns-configuration.service';

const requiredEnvironment: NodeJS.ProcessEnv = {
  APNS_TEAM_ID: 'TEAM123',
  APNS_KEY_ID: 'KEY123',
  APNS_BUNDLE_ID: 'com.neighbour.app',
  APNS_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\\nprivate-key\\n-----END PRIVATE KEY-----',
};

describe('ApnsConfigurationService', () => {
  it('loads development configuration with defaults', () => {
    const service = new ApnsConfigurationService();

    const configuration = service.load(requiredEnvironment);

    assert.deepEqual(configuration, {
      teamId: 'TEAM123',
      keyId: 'KEY123',
      bundleId: 'com.neighbour.app',
      privateKey: '-----BEGIN PRIVATE KEY-----\nprivate-key\n-----END PRIVATE KEY-----',
      environment: 'development',
      host: 'api.sandbox.push.apple.com',
      tokenLifetimeSeconds: 3_000,
      requestTimeoutMilliseconds: 10_000,
    });
  });

  it('loads production configuration and numeric overrides', () => {
    const service = new ApnsConfigurationService();

    const configuration = service.load({
      ...requiredEnvironment,
      APNS_ENVIRONMENT: 'production',
      APNS_TOKEN_LIFETIME_SECONDS: '2400',
      APNS_REQUEST_TIMEOUT_MS: '15000',
    });

    assert.equal(configuration.environment, 'production');
    assert.equal(configuration.host, 'api.push.apple.com');
    assert.equal(configuration.tokenLifetimeSeconds, 2_400);
    assert.equal(configuration.requestTimeoutMilliseconds, 15_000);
  });

  it('rejects missing required configuration', () => {
    const service = new ApnsConfigurationService();

    assert.throws(
      () =>
        service.load({
          APNS_KEY_ID: 'KEY123',
          APNS_BUNDLE_ID: 'com.neighbour.app',
          APNS_PRIVATE_KEY: 'private-key',
        }),
      /APNS_TEAM_ID/,
    );
  });

  it('rejects an invalid APNs environment', () => {
    const service = new ApnsConfigurationService();

    assert.throws(
      () =>
        service.load({
          ...requiredEnvironment,
          APNS_ENVIRONMENT: 'staging',
        }),
      /development or production/,
    );
  });

  it('rejects invalid numeric settings', () => {
    const service = new ApnsConfigurationService();

    assert.throws(
      () =>
        service.load({
          ...requiredEnvironment,
          APNS_REQUEST_TIMEOUT_MS: '0',
        }),
      /positive integer/,
    );
  });
});
