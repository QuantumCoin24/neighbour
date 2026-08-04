import { Injectable } from '@nestjs/common';

import { HealthMonitorService } from './health/health-monitor.service';
import { OperationalMetricsService } from './metrics/operational-metrics.service';
import { PlatformStatusService } from './status/platform-status.service';
import { OperationalReadinessService } from './readiness/operational-readiness.service';
import { AlertService } from './alerts/alert.service';

import type { OperationalStatusEntity } from './readiness/operational-status.entity';

@Injectable()
export class PlatformOperationsService {
  constructor(
    private readonly health: HealthMonitorService,

    private readonly metrics: OperationalMetricsService,

    private readonly status: PlatformStatusService,

    private readonly readiness: OperationalReadinessService,

    private readonly alerts: AlertService,
  ) {}

  monitor(service: string, status: OperationalStatusEntity) {
    const health = this.health.check(service);

    const metric = this.metrics.record(service, 1);

    const platform = this.status.status();

    const ready = this.readiness.evaluate(status);

    const alert = platform.online ? null : this.alerts.create('Platform offline');

    return {
      health,

      metric,

      platform,

      ready,

      alert,
    };
  }
}
