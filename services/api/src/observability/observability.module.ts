import { Module } from '@nestjs/common';

import { SystemHealthService } from './health/system-health.service';
import { TelemetryService } from './telemetry/telemetry.service';
import { ObservabilityAlertService } from './alerts/observability-alert.service';
import { ObservabilityIntelligenceService } from './intelligence/observability-intelligence.service';
import { ObservabilitySnapshotService } from './snapshots/observability-snapshot.service';

@Module({
  providers: [
    SystemHealthService,

    TelemetryService,

    ObservabilityAlertService,

    ObservabilityIntelligenceService,

    ObservabilitySnapshotService,
  ],

  exports: [ObservabilityIntelligenceService, ObservabilitySnapshotService],
})
export class ObservabilityModule {}
