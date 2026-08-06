import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';
import type { SubscriptionEntity, SubscriptionPlan } from './subscription.entity';

export interface PremiumPlan {
  id: SubscriptionPlan;
  name: string;
  description: string;
  monthlyPricePence: number;
  annualPricePence: number;
  features: string[];
  recommended: boolean;
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

export type PremiumEntitlement = keyof PremiumEntitlements;

export interface ActivateAppleSubscriptionInput {
  plan: Exclude<SubscriptionPlan, 'FREE'>;
  originalTransactionId: string;
  currentPeriodEnd: Date;
  purchasedAt: Date;
  revokedAt?: Date | null;
}

@Injectable()
export class SubscriptionService {
  constructor(private readonly database: DatabaseService) {}

  private readonly plans: PremiumPlan[] = [
    {
      id: 'FREE',
      name: 'Neighbour Free',
      description: 'The complete core Neighbour experience.',
      monthlyPricePence: 0,
      annualPricePence: 0,
      recommended: false,
      features: [
        'Communities',
        'Local feed',
        'Messaging',
        'Marketplace discovery',
        'Events and maps',
      ],
    },
    {
      id: 'PLUS',
      name: 'Neighbour Plus',
      description: 'Extra tools for active neighbours and community contributors.',
      monthlyPricePence: 499,
      annualPricePence: 4999,
      recommended: true,
      features: [
        'Premium profile presentation',
        'Advanced discovery filters',
        'Enhanced storage',
        'Community boosts',
        'Priority support',
      ],
    },
    {
      id: 'BUSINESS',
      name: 'Neighbour Business',
      description: 'Professional tools for verified local businesses.',
      monthlyPricePence: 1499,
      annualPricePence: 14999,
      recommended: false,
      features: [
        'Everything in Neighbour Plus',
        'Business analytics',
        'Marketplace boosts',
        'Scheduled offers',
        'Business priority support',
      ],
    },
  ];

  getPlans(): PremiumPlan[] {
    return this.plans.map((plan) => ({
      ...plan,
      features: [...plan.features],
    }));
  }

  async findCurrent(ownerId: string): Promise<SubscriptionEntity> {
    const record = await this.database.subscription.findFirst({
      where: {
        ownerId,
        status: 'ACTIVE',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (record) {
      if (record.currentPeriodEnd && record.currentPeriodEnd < new Date()) {
        await this.database.subscription.update({
          where: {
            id: record.id,
          },
          data: {
            status: 'EXPIRED',
          },
        });
      } else {
        return record;
      }
    }

    return this.database.subscription.create({
      data: {
        ownerId,
        plan: 'FREE',
        status: 'ACTIVE',
        provider: 'INTERNAL',
      },
    });
  }

  async getOverview(ownerId: string) {
    const subscription = await this.findCurrent(ownerId);

    return {
      subscription,
      plan: this.plans.find((item) => item.id === subscription.plan) ?? this.plans[0],
      entitlements: this.getEntitlements(subscription.plan),
    };
  }

  async activateInternalPlan(ownerId: string, plan: SubscriptionPlan) {
    await this.cancelActiveSubscriptions(ownerId);

    const subscription = await this.database.subscription.create({
      data: {
        ownerId,
        plan,
        status: 'ACTIVE',
        provider: 'INTERNAL',
        currentPeriodEnd: plan === 'FREE' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1_000),
      },
    });

    return this.overview(subscription);
  }

  async activateAppleSubscription(ownerId: string, input: ActivateAppleSubscriptionInput) {
    const existing = await this.database.subscription.findFirst({
      where: {
        ownerId,
        provider: 'APPLE',
        externalReference: input.originalTransactionId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const revokedAt = input.revokedAt ?? null;

    const isRevoked = revokedAt !== null;

    const isExpired = input.currentPeriodEnd <= new Date();

    const status = isRevoked ? 'CANCELLED' : isExpired ? 'EXPIRED' : 'ACTIVE';

    await this.database.subscription.updateMany({
      where: {
        ownerId,
        status: 'ACTIVE',
        ...(existing
          ? {
              id: {
                not: existing.id,
              },
            }
          : {}),
      },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    const subscription = existing
      ? await this.database.subscription.update({
          where: {
            id: existing.id,
          },
          data: {
            plan: input.plan,
            status,
            provider: 'APPLE',
            currentPeriodEnd: input.currentPeriodEnd,
            startedAt: input.purchasedAt,
            cancelledAt: isRevoked ? revokedAt : null,
          },
        })
      : await this.database.subscription.create({
          data: {
            ownerId,
            plan: input.plan,
            status,
            provider: 'APPLE',
            externalReference: input.originalTransactionId,
            currentPeriodEnd: input.currentPeriodEnd,
            startedAt: input.purchasedAt,
            cancelledAt: isRevoked ? revokedAt : null,
          },
        });

    return this.overview(subscription);
  }

  async hasEntitlement(ownerId: string, entitlement: PremiumEntitlement): Promise<boolean> {
    const subscription = await this.findCurrent(ownerId);

    return this.getEntitlements(subscription.plan)[entitlement];
  }

  getEntitlements(plan: SubscriptionPlan): PremiumEntitlements {
    if (plan === 'BUSINESS') {
      return {
        premiumProfile: true,
        advancedSearch: true,
        enhancedStorage: true,
        communityBoosts: true,
        marketplaceBoosts: true,
        businessAnalytics: true,
        scheduledOffers: true,
        prioritySupport: true,
      };
    }

    if (plan === 'PLUS') {
      return {
        premiumProfile: true,
        advancedSearch: true,
        enhancedStorage: true,
        communityBoosts: true,
        marketplaceBoosts: false,
        businessAnalytics: false,
        scheduledOffers: false,
        prioritySupport: true,
      };
    }

    return {
      premiumProfile: false,
      advancedSearch: false,
      enhancedStorage: false,
      communityBoosts: false,
      marketplaceBoosts: false,
      businessAnalytics: false,
      scheduledOffers: false,
      prioritySupport: false,
    };
  }

  private async cancelActiveSubscriptions(ownerId: string): Promise<void> {
    await this.database.subscription.updateMany({
      where: {
        ownerId,
        status: 'ACTIVE',
      },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });
  }

  private overview(subscription: SubscriptionEntity) {
    return {
      subscription,
      plan: this.plans.find((item) => item.id === subscription.plan) ?? this.plans[0],
      entitlements: this.getEntitlements(subscription.plan),
    };
  }
}
