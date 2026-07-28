import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ApnsConfigurationService } from '../src/notification/config/apns-configuration.service';
import { ApnsProviderTokenService } from '../src/notification/auth/apns-provider-token.service';
import { ApnsHttp2TransportService } from '../src/notification/transport/apns-http2-transport.service';

class TestConfigurationService extends ApnsConfigurationService {
  override load() {
    return {
      teamId: 'TEAM',
      keyId: 'KEY',
      bundleId: 'com.neighbour.app',
      privateKey: 'private-key',
      environment: 'development' as const,
      host: 'api.sandbox.push.apple.com',
      tokenLifetimeSeconds: 3600,
      requestTimeoutMilliseconds: 10000,
    };
  }
}

class TestTokenService extends ApnsProviderTokenService {
  constructor() {
    super(new TestConfigurationService());
  }
}

describe('ApnsHttp2TransportService', () => {
  it('creates a transport response', async () => {
    const service = new ApnsHttp2TransportService(
      new TestConfigurationService(),
      new TestTokenService(),
    );

    const response = await service.send({
      deviceToken: 'device-token',
      headers: {},
      payload: {
        aps: {
          alert: 'Hello',
        },
      },
    });

    assert.deepEqual(response, {
      status: 200,
      accepted: true,
      endpoint: 'https://api.sandbox.push.apple.com/3/device',
    });
  });
});
