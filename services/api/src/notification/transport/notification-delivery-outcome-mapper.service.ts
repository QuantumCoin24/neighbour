import { Injectable } from '@nestjs/common';

import type { ApnsHttp2TransportResult } from './apns-http2-transport.service';

export interface NotificationDeliveryOutcome {
  success: boolean;
  provider: 'apns';
  endpoint: string;
  retryable: boolean;
}

@Injectable()
export class NotificationDeliveryOutcomeMapperService {
  map(result: ApnsHttp2TransportResult): NotificationDeliveryOutcome {
    return {
      success: result.accepted,
      provider: 'apns',
      endpoint: result.endpoint,
      retryable: result.retryable,
    };
  }
}
