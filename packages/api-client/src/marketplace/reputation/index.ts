import { apiRequest } from '../../client';

import type { MarketplaceReputationHealth } from './types';

export function getMarketplaceReputationHealth(): Promise<MarketplaceReputationHealth> {
  return apiRequest<MarketplaceReputationHealth>('/marketplace/reputation/health');
}

export function getMarketplaceReviewRules() {
  return apiRequest<{
    minimumRating: number;
    maximumRating: number;
    oneReviewPerParticipantPerTransaction: boolean;
    completedTransactionRequired: boolean;
    verifiedTransactionBadge: boolean;
    responseAllowed: boolean;
    moderationEnabled: boolean;
  }>('/marketplace/reputation/review-rules');
}

export * from './types';
