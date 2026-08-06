export interface MarketplaceModerationRiskInput {
  fraudSignalWeight: number;
  activeDisputes: number;
  confirmedDisputes: number;
  cancellationRate: number;
  refundRate: number;
  reportCount: number;
  identityVerified: boolean;
  accountAgeDays: number;
  previousWarnings: number;
  previousSuspensions: number;
}

export interface MarketplaceModerationRiskResult {
  riskScore: number;
  fraudScore: number;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL';
  requiresManualReview: boolean;
  factors: Record<string, number>;
}
