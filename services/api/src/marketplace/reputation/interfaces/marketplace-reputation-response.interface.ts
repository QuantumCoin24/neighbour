export type MarketplaceReviewStatus = 'PENDING' | 'PUBLISHED' | 'HIDDEN' | 'REMOVED';

export type MarketplaceReputationLevel =
  'NEW' | 'DEVELOPING' | 'TRUSTED' | 'HIGHLY_TRUSTED' | 'EXCEPTIONAL';

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
  awardedAt: Date;
}

export interface MarketplaceReviewResponse {
  id: string;
  transactionId: string;
  reviewerId: string;
  subjectId: string;
  rating: number;
  comment: string | null;
  response: string | null;
  status: MarketplaceReviewStatus;
  verifiedTransaction: boolean;
  publishedAt: Date | null;
  respondedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketplaceReputationResponse {
  userId: string;
  score: number;
  level: MarketplaceReputationLevel;
  riskScore: number;
  metrics: MarketplaceReputationMetrics;
  badges: MarketplaceReputationBadge[];
  recentReviews: MarketplaceReviewResponse[];
  calculatedAt: Date;
}

export interface MarketplaceReputationHealthResponse {
  service: 'Commerce ReputationOS';
  status: 'READY';
  architecture: 'EVENT_DRIVEN';
  scoreRange: {
    minimum: 0;
    maximum: 1_000;
  };
}
