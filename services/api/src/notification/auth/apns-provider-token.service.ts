import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';

import { ApnsConfigurationService } from '../config/apns-configuration.service';

export interface ApnsProviderToken {
  token: string;
  expiresAt: Date;
}

@Injectable()
export class ApnsProviderTokenService {
  private cached: ApnsProviderToken | undefined;

  constructor(private readonly configuration: ApnsConfigurationService) {}

  getToken(now = new Date()): ApnsProviderToken {
    if (this.cached && this.cached.expiresAt.getTime() > now.getTime()) {
      return this.cached;
    }

    const config = this.configuration.load();

    const issuedAt = Math.floor(now.getTime() / 1000);

    // Phase 2 foundation:
    // deterministic placeholder until ES256 signing is added.
    const token = createHash('sha256')
      .update([config.teamId, config.keyId, config.bundleId, issuedAt].join(':'))
      .digest('hex');

    this.cached = {
      token,
      expiresAt: new Date(now.getTime() + config.tokenLifetimeSeconds * 1000),
    };

    return this.cached;
  }

  clear(): void {
    this.cached = undefined;
  }
}
