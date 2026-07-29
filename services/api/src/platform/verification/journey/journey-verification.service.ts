import { Injectable } from '@nestjs/common';

import type { JourneyStepEntity } from './journey-step.entity';


@Injectable()
export class JourneyVerificationService {


  verify(
    step: JourneyStepEntity,
  ) {

    return {

      ...step,

      verified:
        step.status === 'READY',

      verifiedAt: new Date(),

    };

  }


}
