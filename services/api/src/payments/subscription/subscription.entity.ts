export type SubscriptionPlan = 'FREE' | 'PLUS' | 'BUSINESS';

export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED';

export type SubscriptionProvider = 'INTERNAL' | 'APPLE' | 'STRIPE';

export interface SubscriptionEntity {
  id: string;
  ownerId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  provider: SubscriptionProvider;
  externalReference: string | null;
  startedAt: Date;
  currentPeriodEnd: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
