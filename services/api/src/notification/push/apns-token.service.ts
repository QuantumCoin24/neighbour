import { Injectable } from '@nestjs/common';
import { createPrivateKey, sign, type KeyObject } from 'node:crypto';

import type { ApnsConfig } from './apns-config.interface';

interface CachedToken {
  value: string;
  issuedAt: number;
  keyId: string;
  teamId: string;
}

@Injectable()
export class ApnsTokenService {
  private cachedToken: CachedToken | null = null;

  createProviderToken(config: ApnsConfig, now = Math.floor(Date.now() / 1000)): string {
    if (
      this.cachedToken &&
      this.cachedToken.keyId === config.keyId &&
      this.cachedToken.teamId === config.teamId &&
      now - this.cachedToken.issuedAt < 50 * 60
    ) {
      return this.cachedToken.value;
    }

    const header = this.encodeJson({
      alg: 'ES256',
      kid: config.keyId,
    });

    const claims = this.encodeJson({
      iss: config.teamId,
      iat: now,
    });

    const signingInput = `${header}.${claims}`;
    const privateKey = this.createKey(config.privateKey);

    const signature = sign('sha256', Buffer.from(signingInput), {
      key: privateKey,
      dsaEncoding: 'ieee-p1363',
    });

    const token = [signingInput, this.base64Url(signature)].join('.');

    this.cachedToken = {
      value: token,
      issuedAt: now,
      keyId: config.keyId,
      teamId: config.teamId,
    };

    return token;
  }

  clearCache(): void {
    this.cachedToken = null;
  }

  private createKey(privateKey: string): KeyObject {
    return createPrivateKey({
      key: privateKey,
      format: 'pem',
    });
  }

  private encodeJson(value: Record<string, unknown>): string {
    return this.base64Url(Buffer.from(JSON.stringify(value)));
  }

  private base64Url(value: Buffer): string {
    return value.toString('base64').replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
  }
}
