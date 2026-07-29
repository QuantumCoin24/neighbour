import { Injectable } from '@nestjs/common';

import { ApnsErrorClassifierService } from './apns-error-classifier.service';
import { ApnsRequestBuilderService } from './apns-request-builder.service';
import { ApnsResponseParserService } from './apns-response-parser.service';
import { ApnsRetryPolicyService } from './apns-retry-policy.service';
import { ApnsSessionManagerService } from './apns-session-manager.service';

export interface ApnsHttp2TransportResult {
  status: number;
  accepted: boolean;
  endpoint: string;
  classification: 'success' | 'permanent' | 'temporary' | 'unknown';
  retryable: boolean;
  reason?: string;
}

@Injectable()
export class ApnsHttp2TransportService {
  constructor(
    private readonly requestBuilder: ApnsRequestBuilderService,
    private readonly sessionManager: ApnsSessionManagerService,
    private readonly responseParser: ApnsResponseParserService,
    private readonly errorClassifier: ApnsErrorClassifierService,
    private readonly retryPolicy: ApnsRetryPolicyService,
  ) {}

  async send(request: {
    deviceToken: string;
    headers: Record<string, string>;
    payload: Readonly<Record<string, unknown>>;
  }): Promise<ApnsHttp2TransportResult> {
    const apnsRequest = this.requestBuilder.build(request.deviceToken);
    const session = this.sessionManager.getSession(apnsRequest.authority);
    const stream = session.request(apnsRequest.headers);

    return await new Promise<ApnsHttp2TransportResult>((resolve) => {
      stream.once('response', (headers: Record<string, unknown>) => {
        const status = Number(headers[':status'] ?? 500);
        const parsed = this.responseParser.parse(status);

        const classification = this.errorClassifier.classify(parsed.status, parsed.reason);

        resolve({
          ...parsed,
          endpoint: `https://${apnsRequest.authority}` + apnsRequest.headers[':path'],
          classification,
          retryable: this.retryPolicy.shouldRetry(classification, 0),
        });
      });

      stream.end(JSON.stringify(request.payload));
    });
  }
}
