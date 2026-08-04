import { Injectable } from '@nestjs/common';

import { ReputationService } from './reputation/reputation.service';
import { VerificationService } from './verification/verification.service';

@Injectable()
export class TrustIntelligenceService {
  constructor(
    private readonly reputation: ReputationService,

    private readonly verification: VerificationService,
  ) {}

  analyse(userId: string) {
    const reputation = this.reputation.findByUser(userId);

    const verification = this.verification.findBySubject(userId);

    const score = (reputation?.score ?? 0) + (verification.length > 0 ? 25 : 0);

    return {
      userId,

      score,

      level: score >= 75 ? 'HIGH' : score >= 30 ? 'MEDIUM' : 'LOW',

      signals: {
        reputation: reputation?.score ?? 0,

        verified: verification.length > 0,
      },
    };
  }
}
