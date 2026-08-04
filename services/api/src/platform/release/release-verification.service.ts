import { Injectable } from '@nestjs/common';

import type { ReleaseStatusEntity } from './release-status.entity';

@Injectable()
export class ReleaseVerificationService {
  verify(status: ReleaseStatusEntity) {
    return {
      ...status,

      verified: status.status === 'READY',

      verifiedAt: new Date(),
    };
  }
}
