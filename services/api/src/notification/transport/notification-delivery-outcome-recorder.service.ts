import { Injectable } from '@nestjs/common';

import type { NotificationDeliveryOutcome } from './notification-delivery-outcome-mapper.service';

export interface NotificationDeliveryRecord extends NotificationDeliveryOutcome {
  recordedAt: Date;
}

@Injectable()
export class NotificationDeliveryOutcomeRecorderService {
  record(outcome: NotificationDeliveryOutcome): NotificationDeliveryRecord {
    return {
      ...outcome,
      recordedAt: new Date(),
    };
  }
}
