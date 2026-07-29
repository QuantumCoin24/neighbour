import { Injectable } from '@nestjs/common';

import { ReputationService } from './reputation/reputation.service';
import { VerificationService } from './verification/verification.service';

@Injectable()
export class TrustProfileService {
  constructor(
    private readonly reputation: ReputationService,
    private readonly verification: VerificationService,
  ) {}

  getUserTrust(userId: string) {
    return {
      reputation: this.reputation.findByUser(userId),

      verification: this.verification.findBySubject(userId),
    };
  }
}
