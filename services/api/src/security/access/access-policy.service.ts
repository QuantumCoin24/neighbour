import { Injectable } from '@nestjs/common';

import type { AccessPolicyEntity } from './access-policy.entity';

@Injectable()
export class AccessPolicyService {
  private policies: AccessPolicyEntity[] = [];

  create(policy: AccessPolicyEntity): AccessPolicyEntity {
    this.policies.push(policy);

    return policy;
  }

  list(): AccessPolicyEntity[] {
    return this.policies;
  }
}
