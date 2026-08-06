import { Injectable } from '@nestjs/common';

import type { MarketplaceReputationHealthResponse } from '../interfaces/marketplace-reputation-response.interface';
import { MarketplaceReputationScoreService } from '../scoring/marketplace-reputation-score.service';

@Injectable()
export class MarketplaceReputationService {
  constructor(private readonly scoring: MarketplaceReputationScoreService) {}

  getHealth(): MarketplaceReputationHealthResponse {
    void this.scoring;

    return {
      service: 'Commerce ReputationOS',
      status: 'READY',
      architecture: 'EVENT_DRIVEN',
      scoreRange: {
        minimum: 0,
        maximum: 1_000,
      },
    };
  }

  getReviewRules() {
    return {
      minimumRating: 1,
      maximumRating: 5,
      oneReviewPerParticipantPerTransaction: true,
      completedTransactionRequired: true,
      verifiedTransactionBadge: true,
      responseAllowed: true,
      moderationEnabled: true,
    };
  }

  previewScore(input: {
    completedTransactions: number;
    averageRating: number | null;
    completionRate: number | null;
    cancellationRate: number | null;
    disputeRate: number | null;
    identityVerified: boolean;
    accountAgeDays: number;
  }) {
    return this.scoring.calculate({
      metrics: {
        completedTransactions: input.completedTransactions,
        successfulPurchases: 0,
        successfulSales: 0,
        cancelledTransactions: 0,
        disputedTransactions: 0,
        verifiedReviews: 0,
        positiveReviews: 0,
        neutralReviews: 0,
        negativeReviews: 0,
        averageRating: input.averageRating,
        completionRate: input.completionRate,
        cancellationRate: input.cancellationRate,
        disputeRate: input.disputeRate,
        responseRate: null,
        averageResponseMinutes: null,
      },
      identityVerified: input.identityVerified,
      accountAgeDays: input.accountAgeDays,
      activeReports: 0,
      confirmedFraudSignals: 0,
    });
  }
}
