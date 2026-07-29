import { Injectable } from '@nestjs/common';


@Injectable()
export class MetricsReadinessService {


  check(
    metrics: string,
  ) {

    return {

      metrics,

      available:
        metrics === 'READY',

      checkedAt: new Date(),

    };

  }


}
