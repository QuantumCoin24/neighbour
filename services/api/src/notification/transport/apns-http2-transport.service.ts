import { Injectable } from '@nestjs/common';

import { ApnsConfigurationService } from '../config/apns-configuration.service';
import { ApnsProviderTokenService } from '../auth/apns-provider-token.service';

export interface ApnsTransportRequest {
  deviceToken: string;
  headers: Record<string, string>;
  payload: unknown;
}

export interface ApnsTransportResponse {
  status: number;
  accepted: boolean;
  endpoint: string;
}

@Injectable()
export class ApnsHttp2TransportService {
  constructor(
    private readonly configuration: ApnsConfigurationService,
    private readonly providerToken: ApnsProviderTokenService,
  ) {}

  async send(request: ApnsTransportRequest): Promise<ApnsTransportResponse> {
    const config = this.configuration.load();
    const token = this.providerToken.getToken();

    // Phase 3 foundation.
    // HTTP/2 session wiring arrives in the next phase.
    void request;
    void token;

    return {
      status: 200,
      accepted: true,
      endpoint: `https://${config.host}/3/device`,
    };
  }
}
