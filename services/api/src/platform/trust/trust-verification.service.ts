import { Injectable } from '@nestjs/common';

import type { TrustStatusEntity } from './trust-status.entity';

@Injectable()
export class TrustVerificationService {
  verify(status: TrustStatusEntity) {
    return {
      ...status,

      verified: status.status === 'READY',

      verifiedAt: new Date(),
    };
  }
}
