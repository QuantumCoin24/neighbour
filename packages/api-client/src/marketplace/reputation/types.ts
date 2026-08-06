export type MarketplaceReputationLevel =
  'NEW' | 'DEVELOPING' | 'TRUSTED' | 'HIGHLY_TRUSTED' | 'EXCEPTIONAL';

export type MarketplaceReviewStatus = 'PENDING' | 'PUBLISHED' | 'HIDDEN' | 'REMOVED';

export interface MarketplaceReputationMetrics {
  completedTransactions: number;
  successfulPurchases: number;
  successfulSales: number;
  cancelledTransactions: number;
  disputedTransactions: number;
  verifiedReviews: number;
  positiveReviews: number;
  neutralReviews: number;
  negativeReviews: number;
  averageRating: number | null;
  completionRate: number | null;
  cancellationRate: number | null;
  disputeRate: number | null;
  responseRate: number | null;
  averageResponseMinutes: number | null;
}

export interface MarketplaceReputationBadge {
  id: string;
  code: string;
  title: string;
  description: string;
  awardedAt: string;
}

export interface MarketplaceReview {
  id: string;
  transactionId: string;
  reviewerId: string;
  subjectId: string;
  rating: number;
  comment: string | null;
  response: string | null;
  status: MarketplaceReviewStatus;
  verifiedTransaction: boolean;
  publishedAt: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceCommerceReputation {
  userId: string;
  score: number;
  level: MarketplaceReputationLevel;
  riskScore: number;
  metrics: MarketplaceReputationMetrics;
  badges: MarketplaceReputationBadge[];
  recentReviews: MarketplaceReview[];
  calculatedAt: string;
}

export interface MarketplaceReputationHealth {
  service: 'Commerce ReputationOS';
  status: 'READY';
  architecture: 'EVENT_DRIVEN';
  scoreRange: {
    minimum: 0;
    maximum: 1_000;
  };
}
