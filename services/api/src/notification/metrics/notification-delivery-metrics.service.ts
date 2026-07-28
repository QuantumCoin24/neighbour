import { Injectable } from '@nestjs/common';

import {
  NotificationDeliveryMetricsSnapshot,
  NotificationDeliveryOutcome,
} from './notification-delivery-metrics.interface';

@Injectable()
export class NotificationDeliveryMetricsService {
  private metrics: NotificationDeliveryMetricsSnapshot = {
    realtime: 0,
    push: 0,
    retryQueued: 0,
    failed: 0,
  };

  record(outcome: NotificationDeliveryOutcome): void {
    switch (outcome) {
      case NotificationDeliveryOutcome.REALTIME:
        this.metrics.realtime++;
        break;

      case NotificationDeliveryOutcome.PUSH:
        this.metrics.push++;
        break;

      case NotificationDeliveryOutcome.RETRY:
        this.metrics.retryQueued++;
        break;

      case NotificationDeliveryOutcome.FAILED:
        this.metrics.failed++;
        break;
    }
  }

  snapshot(): NotificationDeliveryMetricsSnapshot {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {
      realtime: 0,
      push: 0,
      retryQueued: 0,
      failed: 0,
    };
  }
}
