import { Injectable } from '@nestjs/common';

import type { ApnsConfig } from './apns-config.interface';

@Injectable()
export class ApnsConfigService {
  getConfig(): ApnsConfig | null {
    const teamId = process.env.APNS_TEAM_ID?.trim();
    const keyId = process.env.APNS_KEY_ID?.trim();
    const bundleId = process.env.APNS_BUNDLE_ID?.trim();
    const encodedPrivateKey = process.env.APNS_PRIVATE_KEY_BASE64?.trim();

    if (!teamId || !keyId || !bundleId || !encodedPrivateKey) {
      return null;
    }

    return {
      teamId,
      keyId,
      bundleId,
      privateKey: Buffer.from(encodedPrivateKey, 'base64').toString('utf8'),
      production: process.env.APNS_PRODUCTION?.trim().toLowerCase() === 'true',
    };
  }

  isConfigured(): boolean {
    return this.getConfig() !== null;
  }
}
