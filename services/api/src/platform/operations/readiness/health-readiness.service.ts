import { Injectable } from '@nestjs/common';


@Injectable()
export class HealthReadinessService {


  check(
    health: string,
  ) {

    return {

      health,

      available:
        health === 'READY',

      checkedAt: new Date(),

    };

  }


}
