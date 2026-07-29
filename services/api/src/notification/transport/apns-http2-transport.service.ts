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

    const stream = session.request(apnsRequest.headers);

    return await new Promise<{
      status: number;
      accepted: boolean;
      endpoint: string;
    }>((resolve) => {
      stream.once('response', (headers: Record<string, unknown>) => {
        const status = Number(headers[':status'] ?? 500);

        resolve({
          status,
          accepted: status === 200,
          endpoint: `https://${apnsRequest.authority}` + apnsRequest.headers[':path'],
        });
      });

      stream.end(JSON.stringify(request.payload));
    });
  }
}
