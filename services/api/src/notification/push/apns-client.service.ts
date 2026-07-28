import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { connect, constants, type ClientHttp2Session } from 'node:http2';

import { ApnsConfigService } from './apns-config.service';
import type { ApnsConfig } from './apns-config.interface';
import type { ApnsSendRequest, ApnsSendResult } from './apns-payload.interface';
import { ApnsTokenService } from './apns-token.service';

interface ApnsErrorResponse {
  reason?: string;
  timestamp?: number;
}

@Injectable()
export class ApnsClientService {
  constructor(
    private readonly configService: ApnsConfigService,
    private readonly tokenService: ApnsTokenService,
  ) {}

  async send(request: ApnsSendRequest): Promise<ApnsSendResult> {
    const config = this.configService.getConfig();

    if (!config) {
      throw new ServiceUnavailableException('Apple push notifications are not configured.');
    }

    const session = this.createSession(config);

    try {
      return await this.sendThroughSession(session, config, request);
    } finally {
      session.close();
    }
  }

  private createSession(config: ApnsConfig): ClientHttp2Session {
    const host = config.production
      ? 'https://api.push.apple.com'
      : 'https://api.sandbox.push.apple.com';

    return connect(host);
  }

  private sendThroughSession(
    session: ClientHttp2Session,
    config: ApnsConfig,
    request: ApnsSendRequest,
  ): Promise<ApnsSendResult> {
    return new Promise((resolve, reject) => {
      const token = this.tokenService.createProviderToken(config);

      const headers: Record<string, string | number> = {
        [constants.HTTP2_HEADER_METHOD]: 'POST',
        [constants.HTTP2_HEADER_PATH]: `/3/device/${request.deviceToken}`,
        authorization: `bearer ${token}`,
        'apns-topic': config.bundleId,
        'apns-push-type': 'alert',
        'apns-priority': request.priority ?? 10,
        'content-type': 'application/json',
      };

      if (request.collapseId) {
        headers['apns-collapse-id'] = request.collapseId;
      }

      if (request.expiration) {
        headers['apns-expiration'] = Math.floor(request.expiration.getTime() / 1000);
      }

      const stream = session.request(headers);
      const responseChunks: Buffer[] = [];
      let statusCode = 0;
      let apnsId: string | null = null;

      stream.setEncoding('utf8');

      stream.on('response', (responseHeaders) => {
        statusCode = Number(responseHeaders[constants.HTTP2_HEADER_STATUS] ?? 0);

        const responseApnsId = responseHeaders['apns-id'];

        apnsId = typeof responseApnsId === 'string' ? responseApnsId : null;
      });

      stream.on('data', (chunk: string) => {
        responseChunks.push(Buffer.from(chunk));
      });

      stream.on('error', reject);

      stream.on('end', () => {
        const responseBody = Buffer.concat(responseChunks).toString('utf8');

        const error = this.parseError(responseBody);

        resolve({
          accepted: statusCode >= 200 && statusCode < 300,
          statusCode,
          apnsId,
          reason: error.reason ?? null,
          timestamp: error.timestamp ?? null,
        });
      });

      stream.end(JSON.stringify(request.payload));
    });
  }

  private parseError(responseBody: string): ApnsErrorResponse {
    if (!responseBody) {
      return {};
    }

    try {
      return JSON.parse(responseBody) as ApnsErrorResponse;
    } catch {
      return {
        reason: 'InvalidApnsResponse',
      };
    }
  }
}
