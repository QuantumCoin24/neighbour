import { Injectable } from '@nestjs/common';

import type { OperationalStatusEntity } from './operational-status.entity';


@Injectable()
export class OperationalReadinessService {


  evaluate(
    status: OperationalStatusEntity,
  ) {

    return {

      ...status,

      ready:
        status.status === 'READY',

      checkedAt: new Date(),

    };

  }


}
