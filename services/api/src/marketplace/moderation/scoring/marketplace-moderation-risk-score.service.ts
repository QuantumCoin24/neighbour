import { Injectable } from '@nestjs/common';

import type {
  MarketplaceModerationRiskInput,
  MarketplaceModerationRiskResult,
} from './marketplace-moderation-risk-score.interface';

@Injectable()
export class MarketplaceModerationRiskScoreService {
  calculate(input: MarketplaceModerationRiskInput): MarketplaceModerationRiskResult {
    const disputePenalty = input.activeDisputes * 35 + input.confirmedDisputes * 90;

    const behaviourPenalty =
      Math.round(input.cancellationRate * 250) + Math.round(input.refundRate * 200);

    const reportPenalty = input.reportCount * 25;

    const enforcementPenalty = input.previousWarnings * 20 + input.previousSuspensions * 120;

    const identityPenalty = input.identityVerified ? 0 : 60;

    const youngAccountPenalty = input.accountAgeDays < 7 ? 80 : input.accountAgeDays < 30 ? 35 : 0;

    const fraudScore = Math.max(
      0,
      Math.min(
        1_000,
        input.fraudSignalWeight + disputePenalty + reportPenalty + enforcementPenalty,
      ),
    );

    const riskScore = Math.max(
      0,
      Math.min(1_000, fraudScore + behaviourPenalty + identityPenalty + youngAccountPenalty),
    );

    const priority =
      riskScore >= 850
        ? 'CRITICAL'
        : riskScore >= 650
          ? 'URGENT'
          : riskScore >= 450
            ? 'HIGH'
            : riskScore >= 200
              ? 'NORMAL'
              : 'LOW';

    return {
      riskScore,
      fraudScore,
      priority,
      requiresManualReview: riskScore >= 450 || fraudScore >= 400,
      factors: {
        disputePenalty,
        behaviourPenalty,
        reportPenalty,
        enforcementPenalty,
        identityPenalty,
        youngAccountPenalty,
      },
    };
  }
}
