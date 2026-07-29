import { Injectable } from '@nestjs/common';

import type { WorkflowEntity } from './workflow.entity';


@Injectable()
export class WorkflowService {

  create(
    workflow: WorkflowEntity,
  ): WorkflowEntity {

    return workflow;

  }

}
