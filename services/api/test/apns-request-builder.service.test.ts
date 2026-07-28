import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ApnsRequestBuilderService } from '../src/notification/transport/apns-request-builder.service';
import { ApnsAuthorizationService } from '../src/notification/auth/apns-authorization.service';
import { ApnsConfigurationService } from '../src/notification/config/apns-configuration.service';

class Config extends ApnsConfigurationService {
  override load() {
    return {
      teamId: 'TEAM',
      keyId: 'KEY',
      bundleId: 'com.neighbour.app',
      privateKey: 'PRIVATE',
      environment: 'development' as const,
      host: 'api.sandbox.push.apple.com',
      tokenLifetimeSeconds: 3600,
      requestTimeoutMilliseconds: 10000,
    };
  }
}

class Auth extends ApnsAuthorizationService {
  constructor() {
    super({ createAuthorizationHeader: () => 'bearer token' } as never);
  }

  override createAuthorizationHeader() {
    return 'bearer token';
  }
}

describe('ApnsRequestBuilderService', () => {
  it('builds APNs request metadata', () => {
    const builder = new ApnsRequestBuilderService(new Config(), new Auth());

    const request = builder.build('DEVICE123');

    assert.equal(request.authority, 'api.sandbox.push.apple.com');
    assert.equal(request.headers.authorization, 'bearer token');
    assert.equal(request.headers['apns-topic'], 'com.neighbour.app');
    assert.equal(request.headers[':path'], '/3/device/DEVICE123');
    assert.equal(request.headers[':method'], 'POST');
  });
});
