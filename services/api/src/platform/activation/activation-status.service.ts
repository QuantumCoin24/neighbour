import { Injectable } from '@nestjs/common';


@Injectable()
export class ActivationStatusService {

  status(
    domain: string,
    state: string,
  ) {

    return {

      domain,

      state,

      checkedAt: new Date(),

    };

  }

}
