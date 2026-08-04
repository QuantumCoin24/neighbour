import { Module } from '@nestjs/common';

import { PlatformOperationsService } from './platform-operations.service';

import { HealthMonitorService } from './health/health-monitor.service';
import { OperationalMetricsService } from './metrics/operational-metrics.service';
import { PlatformStatusService } from './status/platform-status.service';
import { OperationalReadinessService } from './readiness/operational-readiness.service';
import { AlertService } from './alerts/alert.service';

@Module({
  providers: [
    PlatformOperationsService,

    HealthMonitorService,

    OperationalMetricsService,

    PlatformStatusService,

    OperationalReadinessService,

    AlertService,
  ],

  exports: [PlatformOperationsService],
})
export class OperationsModule {}
