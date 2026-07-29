import { Injectable } from '@nestjs/common';


@Injectable()
export class SafetyCheckService {


  evaluate(
    safety: string,
  ) {

    return {

      safety,

      passed:
        safety === 'PASSED',

      checkedAt: new Date(),

    };

  }


}
