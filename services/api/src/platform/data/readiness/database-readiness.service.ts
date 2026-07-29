import { Injectable } from '@nestjs/common';

import type { ProductionDataStatusEntity } from './production-data-status.entity';


@Injectable()
export class DatabaseReadinessService {


  evaluate(
    status: ProductionDataStatusEntity,
  ) {

    return {

      ...status,

      ready:
        status.status === 'READY',

      checkedAt: new Date(),

    };

  }


}
