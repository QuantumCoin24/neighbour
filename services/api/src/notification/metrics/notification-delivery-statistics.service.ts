import { Injectable } from '@nestjs/common';

export interface NotificationDeliveryStatistics {
  sent: number;
  delivered: number;
  failed: number;
}

@Injectable()
export class NotificationDeliveryStatisticsService {
  private stats: NotificationDeliveryStatistics = {
    sent: 0,
    delivered: 0,
    failed: 0,
  };

  markSent(): void {
    this.stats.sent++;
  }

  markDelivered(): void {
    this.stats.delivered++;
  }

  markFailed(): void {
    this.stats.failed++;
  }

  snapshot(): NotificationDeliveryStatistics {
    return { ...this.stats };
  }

  reset(): void {
    this.stats = {
      sent: 0,
      delivered: 0,
      failed: 0,
    };
  }
}
