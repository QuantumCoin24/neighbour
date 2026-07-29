import { Injectable } from '@nestjs/common';

import type { NotificationDeliveryRecord } from './notification-delivery-outcome-recorder.service';

export interface NotificationDeliveryAuditEvent {
  provider: string;
  success: boolean;
  endpoint: string;
  recordedAt: Date;
}

@Injectable()
export class NotificationDeliveryAuditMapperService {
  map(record: NotificationDeliveryRecord): NotificationDeliveryAuditEvent {
    return {
      provider: record.provider,
      success: record.success,
      endpoint: record.endpoint,
      recordedAt: record.recordedAt,
    };
  }
}
