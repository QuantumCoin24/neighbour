import { Injectable } from '@nestjs/common';


@Injectable()
export class BuildVerificationService {


  check(
    build: string,
  ) {

    return {

      build,

      passed:
        build === 'PASS',

      checkedAt: new Date(),

    };

  }


}
