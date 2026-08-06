export type AppleProductPlan = 'PLUS' | 'BUSINESS';

export type AppleProductPeriod = 'MONTHLY' | 'YEARLY';

export interface AppleSubscriptionProduct {
  productId: string;
  plan: AppleProductPlan;
  period: AppleProductPeriod;
  displayName: string;
  description: string;
  pricePence: number;
}

export interface VerifyAppleTransactionInput {
  signedTransactionInfo: string;
}

export interface RestoreApplePurchasesInput {
  signedTransactions: string[];
}
