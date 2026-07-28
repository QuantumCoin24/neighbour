import { Injectable } from '@nestjs/common';

import { ApnsAuthorizationService } from '../auth/apns-authorization.service';
import { ApnsConfigurationService } from '../config/apns-configuration.service';

export interface ApnsRequest {
  authority: string;
  headers: Record<string, string>;
}

@Injectable()
export class ApnsRequestBuilderService {
  constructor(
    private readonly configuration: ApnsConfigurationService,
    private readonly authorization: ApnsAuthorizationService,
  ) {}

  build(deviceToken: string): ApnsRequest {
    const config = this.configuration.load();

    return {
      authority: config.host,
      headers: {
        authorization: this.authorization.createAuthorizationHeader(),
        'apns-topic': config.bundleId,
        ':path': `/3/device/${deviceToken}`,
        ':method': 'POST',
      },
    };
  }
}
