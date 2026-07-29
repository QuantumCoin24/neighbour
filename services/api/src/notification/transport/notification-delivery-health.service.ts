import { Injectable } from '@nestjs/common';

import { NotificationDeliveryMetricsSnapshotService } from './notification-delivery-metrics-snapshot.service';

export type NotificationDeliveryHealthStatus = 'healthy' | 'degraded' | 'failing';

export interface NotificationDeliveryHealth {
  status: NotificationDeliveryHealthStatus;
  successRate: number;
}

@Injectable()
export class NotificationDeliveryHealthService {
  constructor(private readonly snapshotService: NotificationDeliveryMetricsSnapshotService) {}

  check(): NotificationDeliveryHealth {
    const snapshot = this.snapshotService.snapshot();

    let status: NotificationDeliveryHealthStatus = 'healthy';

    if (snapshot.successRate < 0.5) {
      status = 'failing';
    } else if (snapshot.successRate < 0.9) {
      status = 'degraded';
    }

    return {
      status,
      successRate: snapshot.successRate,
    };
  }
}
