import { Injectable } from '@nestjs/common';

import type { PolicyEntity } from './policy.entity';


@Injectable()
export class PolicyService {

  private policies:
    PolicyEntity[] = [];


  create(
    policy: PolicyEntity,
  ): PolicyEntity {

    this.policies.push(policy);

    return policy;
  }


  list(): PolicyEntity[] {
    return this.policies;
  }

}
