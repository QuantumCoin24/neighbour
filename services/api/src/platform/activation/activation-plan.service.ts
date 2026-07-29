import { Injectable } from '@nestjs/common';

import type { ActivationPlanEntity } from './activation-plan.entity';


@Injectable()
export class ActivationPlanService {

  create(
    plan: ActivationPlanEntity,
  ) {

    return {

      ...plan,

      createdAt: new Date(),

    };

  }

}
