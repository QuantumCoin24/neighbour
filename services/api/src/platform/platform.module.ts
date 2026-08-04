import { Module } from '@nestjs/common';

import { PlatformIntelligenceService } from './intelligence/platform-intelligence.service';

import { IntelligenceSnapshotService } from './intelligence/snapshot/intelligence-snapshot.service';
import { RuleEngineService } from './intelligence/rules/rule-engine.service';
import { DecisionService } from './intelligence/decision/decision.service';
import { ResponseService } from './intelligence/response/response.service';

import { AutomationEngineService } from './automation/automation-engine.service';
import { WorkflowService } from './automation/workflows/workflow.service';
import { SchedulerService } from './automation/scheduler/scheduler.service';
import { ExecutionService } from './automation/execution/execution.service';
import { AutomationHistoryService } from './automation/history/automation-history.service';
import { OperationsModule } from './operations/operations.module';
import { AdminModule } from './admin/admin.module';
import { PerformanceModule } from '../performance/performance.module';
import { ObservabilityModule } from '../observability/observability.module';
import { DataModule } from '../data/data.module';

@Module({
  imports: [OperationsModule, AdminModule, PerformanceModule, ObservabilityModule, DataModule],

  providers: [
    PlatformIntelligenceService,

    IntelligenceSnapshotService,

    RuleEngineService,

    DecisionService,

    ResponseService,

    AutomationEngineService,

    WorkflowService,

    SchedulerService,

    ExecutionService,

    AutomationHistoryService,
  ],

  exports: [PlatformIntelligenceService],
})
export class PlatformModule {}
