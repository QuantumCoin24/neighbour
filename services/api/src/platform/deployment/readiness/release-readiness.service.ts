import { Injectable } from '@nestjs/common';


@Injectable()
export class ReleaseReadinessService {


  check(
    release: string,
  ) {

    return {

      release,

      ready:
        release === 'READY',

      checkedAt: new Date(),

    };

  }


}
