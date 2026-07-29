import { Injectable } from '@nestjs/common';


@Injectable()
export class EnvironmentReadinessService {


  check(
    environment: string,
  ) {

    return {

      environment,

      ready:
        environment === 'READY',

      checkedAt: new Date(),

    };

  }


}
