import assert from 'node:assert/strict';
import { generateKeyPairSync, verify } from 'node:crypto';
import { describe, it } from 'node:test';

import type { ApnsConfig } from '../src/notification/push/apns-config.interface';
import { ApnsTokenService } from '../src/notification/push/apns-token.service';

function decodeSegment(segment: string): string {
  return Buffer.from(segment, 'base64url').toString('utf8');
}

describe('ApnsTokenService', () => {
  it('creates a valid ES256 provider token', () => {
    const keys = generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
    });

    const privateKey = keys.privateKey
      .export({
        format: 'pem',
        type: 'pkcs8',
      })
      .toString();

    const config: ApnsConfig = {
      teamId: 'TEAM123456',
      keyId: 'KEY1234567',
      bundleId: 'com.neighbour.app',
      privateKey,
      production: false,
    };

    const service = new ApnsTokenService();
    const token = service.createProviderToken(config, 1_700_000_000);

    const segments = token.split('.');

    assert.equal(segments.length, 3);

    assert.deepEqual(JSON.parse(decodeSegment(segments[0] ?? '')), {
      alg: 'ES256',
      kid: 'KEY1234567',
    });

    assert.deepEqual(JSON.parse(decodeSegment(segments[1] ?? '')), {
      iss: 'TEAM123456',
      iat: 1_700_000_000,
    });

    assert.equal(
      verify(
        'sha256',
        Buffer.from(`${segments[0]}.${segments[1]}`),
        {
          key: keys.publicKey,
          dsaEncoding: 'ieee-p1363',
        },
        Buffer.from(segments[2] ?? '', 'base64url'),
      ),
      true,
    );
  });

  it('reuses a token within the safe cache window', () => {
    const keys = generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
    });

    const config: ApnsConfig = {
      teamId: 'TEAM123456',
      keyId: 'KEY1234567',
      bundleId: 'com.neighbour.app',
      privateKey: keys.privateKey
        .export({
          format: 'pem',
          type: 'pkcs8',
        })
        .toString(),
      production: false,
    };

    const service = new ApnsTokenService();

    const first = service.createProviderToken(config, 1_700_000_000);

    const second = service.createProviderToken(config, 1_700_000_100);

    assert.equal(first, second);
  });
});
