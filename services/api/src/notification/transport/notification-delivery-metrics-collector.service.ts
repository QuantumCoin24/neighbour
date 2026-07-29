import { Injectable } from '@nestjs/common';

import type { NotificationDeliveryAuditEvent } from './notification-delivery-audit-mapper.service';

@Injectable()
export class NotificationDeliveryMetricsCollectorService {
  private total = 0;
  private successful = 0;
  private failed = 0;

  record(
    event: NotificationDeliveryAuditEvent & {
      retryable?: boolean;
    },
  ): void {
    this.total += 1;

    if (event.success) {
      this.successful += 1;
    } else {
      this.failed += 1;
    }
  }

  getMetrics() {
    return {
      total: this.total,
      successful: this.successful,
      failed: this.failed,
    };
  }

  reset(): void {
    this.total = 0;
    this.successful = 0;
    this.failed = 0;
  }
}
