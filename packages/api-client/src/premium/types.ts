export type PremiumPlanId = 'FREE' | 'PLUS' | 'BUSINESS';

export type PremiumSubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED';

export type PremiumSubscriptionProvider = 'INTERNAL' | 'APPLE' | 'STRIPE';

export interface PremiumPlan {
  id: PremiumPlanId;
  name: string;
  description: string;
  monthlyPricePence: number;
  annualPricePence: number;
  features: string[];
  recommended: boolean;
}

export interface PremiumSubscription {
  id: string;
  ownerId: string;
  plan: PremiumPlanId;
  status: PremiumSubscriptionStatus;
  provider: PremiumSubscriptionProvider;
  externalReference: string | null;
  startedAt: string;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PremiumEntitlements {
  premiumProfile: boolean;
  advancedSearch: boolean;
  enhancedStorage: boolean;
  communityBoosts: boolean;
  marketplaceBoosts: boolean;
  businessAnalytics: boolean;
  scheduledOffers: boolean;
  prioritySupport: boolean;
}

export interface PremiumOverview {
  subscription: PremiumSubscription;
  plan: PremiumPlan;
  entitlements: PremiumEntitlements;
}
