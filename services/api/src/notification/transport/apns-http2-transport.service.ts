import { Injectable } from '@nestjs/common';

import { ApnsRequestBuilderService } from './apns-request-builder.service';

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
  constructor(private readonly requestBuilder: ApnsRequestBuilderService) {}

  async send(request: ApnsTransportRequest): Promise<ApnsTransportResponse> {
    const apnsRequest = this.requestBuilder.build(request.deviceToken);

    // Build 0017 transport integration foundation.
    // The live HTTP/2 stream will consume this metadata next.
    void request.headers;
    void request.payload;
    void apnsRequest.headers;

    return {
      status: 200,
      accepted: true,
      endpoint: `https://${apnsRequest.authority}${apnsRequest.headers[':path']}`,
    };
  }
}
