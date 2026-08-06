import type {
  MarketplaceReputationLevel,
  MarketplaceReputationMetrics,
} from '../interfaces/marketplace-reputation-response.interface';

export interface MarketplaceReputationScoreInput {
  metrics: MarketplaceReputationMetrics;
  identityVerified: boolean;
  accountAgeDays: number;
  activeReports: number;
  confirmedFraudSignals: number;
}

export interface MarketplaceReputationScoreResult {
  score: number;
  riskScore: number;
  level: MarketplaceReputationLevel;
  factors: {
    transactionScore: number;
    reviewScore: number;
    reliabilityScore: number;
    identityScore: number;
    riskPenalty: number;
  };
}
