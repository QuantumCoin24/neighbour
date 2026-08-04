import { Injectable } from '@nestjs/common';

import { WorkflowService } from './workflows/workflow.service';
import { SchedulerService } from './scheduler/scheduler.service';
import { ExecutionService } from './execution/execution.service';
import { AutomationHistoryService } from './history/automation-history.service';

import type { WorkflowEntity } from './workflows/workflow.entity';
import type { ExecutionEntity } from './execution/execution.entity';

@Injectable()
export class AutomationEngineService {
  constructor(
    private readonly workflows: WorkflowService,

    private readonly scheduler: SchedulerService,

    private readonly execution: ExecutionService,

    private readonly history: AutomationHistoryService,
  ) {}

  run(workflow: WorkflowEntity, execution: ExecutionEntity) {
    const created = this.workflows.create(workflow);

    const scheduled = this.scheduler.schedule(created.id);

    const executed = this.execution.execute(execution);

    const history = this.history.record(created.id, 'executed');

    return {
      workflow: created,

      scheduled,

      executed,

      history,
    };
  }
}
