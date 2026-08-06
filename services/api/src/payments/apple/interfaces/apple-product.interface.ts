import type { SubscriptionPlan } from '../../subscription/subscription.entity';

export type AppleSubscriptionPeriod = 'MONTHLY' | 'YEARLY';

export interface AppleSubscriptionProduct {
  productId: string;
  plan: Exclude<SubscriptionPlan, 'FREE'>;
  period: AppleSubscriptionPeriod;
  displayName: string;
  description: string;
  pricePence: number;
}

export interface AppleTransactionPayload {
  transactionId: string;
  originalTransactionId: string;
  productId: string;
  bundleId: string | null;
  appAccountToken: string | null;
  purchaseDate: Date;
  expiresDate: Date;
  revocationDate: Date | null;
  environment: 'Sandbox' | 'Production' | null;
}

export interface AppleCommerceHealth {
  module: 'AppleCommerce';
  status: 'operational';
  productCount: number;
  supportedEnvironments: readonly ['Sandbox', 'Production'];
}
