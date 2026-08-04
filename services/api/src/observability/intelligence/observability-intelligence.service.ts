import { Injectable } from '@nestjs/common';

import { SystemHealthService } from '../health/system-health.service';
import { TelemetryService } from '../telemetry/telemetry.service';
import { ObservabilityAlertService } from '../alerts/observability-alert.service';

@Injectable()
export class ObservabilityIntelligenceService {
  constructor(
    private readonly health: SystemHealthService,

    private readonly telemetry: TelemetryService,

    private readonly alerts: ObservabilityAlertService,
  ) {}

  analyse() {
    const system = this.health.check();

    const metric = this.telemetry.record('platform.health', 100);

    const state = system.status === 'HEALTHY' ? 'OPERATIONAL' : 'DEGRADED';

    return {
      state,

      system,

      metric,

      analysedAt: new Date(),
    };
  }
}
