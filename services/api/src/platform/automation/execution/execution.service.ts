import { Injectable } from '@nestjs/common';

import type { ExecutionEntity } from './execution.entity';


@Injectable()
export class ExecutionService {

  execute(
    execution: ExecutionEntity,
  ): ExecutionEntity {

    return execution;

  }

}
