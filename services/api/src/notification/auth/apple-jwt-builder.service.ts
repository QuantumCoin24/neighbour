import { Injectable } from '@nestjs/common';

import { ApnsConfigurationService } from '../config/apns-configuration.service';

export interface AppleJwtHeader {
  alg: 'ES256';
  kid: string;
}

export interface AppleJwtClaims {
  iss: string;
  iat: number;
}

@Injectable()
export class AppleJwtBuilderService {
  constructor(private readonly configuration: ApnsConfigurationService) {}

  build(now = new Date()) {
    const config = this.configuration.load();

    const header: AppleJwtHeader = {
      alg: 'ES256',
      kid: config.keyId,
    };

    const claims: AppleJwtClaims = {
      iss: config.teamId,
      iat: Math.floor(now.getTime() / 1000),
    };

    return {
      header,
      claims,
      algorithm: 'ES256',
      privateKey: config.privateKey,
    };
  }
}
