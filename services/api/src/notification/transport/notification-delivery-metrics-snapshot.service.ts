import { Injectable } from '@nestjs/common';

import { NotificationDeliveryMetricsCollectorService } from './notification-delivery-metrics-collector.service';

export interface NotificationDeliveryMetricsSnapshot {
  total: number;
  successful: number;
  failed: number;
  successRate: number;
}

@Injectable()
export class NotificationDeliveryMetricsSnapshotService {
  constructor(private readonly collector: NotificationDeliveryMetricsCollectorService) {}

  snapshot(): NotificationDeliveryMetricsSnapshot {
    const metrics = this.collector.getMetrics();

    return {
      ...metrics,
      successRate: metrics.total === 0 ? 0 : metrics.successful / metrics.total,
    };
  }
}
