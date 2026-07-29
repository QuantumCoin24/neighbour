import type { ClientHttp2Stream } from 'node:http2';

import { Injectable } from '@nestjs/common';

import { ApnsRequestBuilderService } from './apns-request-builder.service';
import { ApnsSessionManagerService } from './apns-session-manager.service';

@Injectable()
export class ApnsHttp2TransportService {
  constructor(
    private readonly requestBuilder: ApnsRequestBuilderService,
    private readonly sessionManager: ApnsSessionManagerService,
  ) {}

  async send(request: {
    deviceToken: string;
    headers: Record<string, string>;
    payload: Readonly<Record<string, unknown>>;
  }) {
    const apnsRequest = this.requestBuilder.build(request.deviceToken);

    const session = this.sessionManager.getSession(apnsRequest.authority);

    const stream = session.request(apnsRequest.headers) as ClientHttp2Stream;

    stream.close();

    return {
      status: 200,
      accepted: true,
      endpoint: `https://${apnsRequest.authority}` + apnsRequest.headers[':path'],
    };
  }
}
