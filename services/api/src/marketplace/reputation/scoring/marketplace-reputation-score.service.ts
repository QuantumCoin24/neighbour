import { Injectable } from '@nestjs/common';

import type { MarketplaceReputationLevel } from '../interfaces/marketplace-reputation-response.interface';
import type {
  MarketplaceReputationScoreInput,
  MarketplaceReputationScoreResult,
} from './marketplace-reputation-score.interface';

@Injectable()
export class MarketplaceReputationScoreService {
  calculate(input: MarketplaceReputationScoreInput): MarketplaceReputationScoreResult {
    const transactionVolume = Math.min(input.metrics.completedTransactions, 100);

    const transactionScore = transactionVolume * 3;

    const averageRating = input.metrics.averageRating ?? 0;

    const reviewScore = Math.round(Math.max(0, averageRating - 1) * 100);

    const completionRate = input.metrics.completionRate ?? 0;

    const cancellationRate = input.metrics.cancellationRate ?? 0;

    const disputeRate = input.metrics.disputeRate ?? 0;

    const reliabilityScore = Math.round(
      completionRate * 200 - cancellationRate * 150 - disputeRate * 200,
    );

    const identityScore =
      (input.identityVerified ? 75 : 0) + Math.min(Math.floor(input.accountAgeDays / 30), 25);

    const riskPenalty = input.activeReports * 20 + input.confirmedFraudSignals * 150;

    const rawScore =
      100 + transactionScore + reviewScore + reliabilityScore + identityScore - riskPenalty;

    const score = Math.max(0, Math.min(1_000, rawScore));

    const riskScore = Math.max(
      0,
      Math.min(
        1_000,
        riskPenalty + Math.round(cancellationRate * 250) + Math.round(disputeRate * 350),
      ),
    );

    return {
      score,
      riskScore,
      level: this.resolveLevel(score),
      factors: {
        transactionScore,
        reviewScore,
        reliabilityScore,
        identityScore,
        riskPenalty,
      },
    };
  }

  private resolveLevel(score: number): MarketplaceReputationLevel {
    if (score >= 850) {
      return 'EXCEPTIONAL';
    }

    if (score >= 700) {
      return 'HIGHLY_TRUSTED';
    }

    if (score >= 500) {
      return 'TRUSTED';
    }

    if (score >= 250) {
      return 'DEVELOPING';
    }

    return 'NEW';
  }
}
