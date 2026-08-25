import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

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

export type PremiumBillingInterval = 'MONTHLY' | 'ANNUAL';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly database: DatabaseService,
    private readonly config: ConfigService,
  ) {}

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

  async createStripeCheckout(
    ownerId: string,
    input: {
      plan: Exclude<SubscriptionPlan, 'FREE'>;
      interval: PremiumBillingInterval;
    },
  ) {
    if (input.plan !== 'PLUS' && input.plan !== 'BUSINESS') {
      throw new BadRequestException('A paid Premium plan is required.');
    }

    if (input.interval !== 'MONTHLY' && input.interval !== 'ANNUAL') {
      throw new BadRequestException('A valid billing interval is required.');
    }

    const current = await this.findCurrent(ownerId);

    if (current.provider === 'APPLE' && current.plan !== 'FREE' && current.status === 'ACTIVE') {
      throw new ConflictException('Your active Apple subscription must be managed through Apple.');
    }

    const plan = this.plans.find((candidate) => candidate.id === input.plan);

    if (!plan) {
      throw new BadRequestException('Premium plan not found.');
    }

    const unitAmount = input.interval === 'ANNUAL' ? plan.annualPricePence : plan.monthlyPricePence;

    const stripe = this.getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      client_reference_id: ownerId,
      success_url:
        `${this.getWebBaseUrl()}/premium` + '?checkout=success&session_id={CHECKOUT_SESSION_ID}',
      cancel_url: `${this.getWebBaseUrl()}/premium?checkout=cancelled`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'gbp',
            unit_amount: unitAmount,
            recurring: {
              interval: input.interval === 'ANNUAL' ? 'year' : 'month',
            },
            product_data: {
              name: plan.name,
              description: plan.description,
            },
          },
        },
      ],
      metadata: {
        neighbourOwnerId: ownerId,
        neighbourPlan: input.plan,
        neighbourBillingInterval: input.interval,
      },
      subscription_data: {
        metadata: {
          neighbourOwnerId: ownerId,
          neighbourPlan: input.plan,
          neighbourBillingInterval: input.interval,
        },
      },
      allow_promotion_codes: true,
    });

    if (!session.url) {
      throw new BadRequestException('Stripe Checkout did not return a checkout URL.');
    }

    return {
      url: session.url,
      sessionId: session.id,
    };
  }

  async confirmStripeCheckout(ownerId: string, sessionId: string) {
    const normalizedSessionId = sessionId.trim();

    if (!normalizedSessionId) {
      throw new BadRequestException('Stripe Checkout session is required.');
    }

    const stripe = this.getStripe();

    const session = await stripe.checkout.sessions.retrieve(normalizedSessionId, {
      expand: ['subscription'],
    });

    if (session.client_reference_id !== ownerId) {
      throw new ForbiddenException('This Stripe Checkout session does not belong to this account.');
    }

    if (session.status !== 'complete') {
      throw new BadRequestException('Stripe Checkout has not completed.');
    }

    const plan = this.readStripePlan(session.metadata?.neighbourPlan);

    const subscription =
      typeof session.subscription === 'string'
        ? await stripe.subscriptions.retrieve(session.subscription)
        : session.subscription;

    if (!subscription) {
      throw new BadRequestException('Stripe subscription was not created.');
    }

    return this.activateStripeSubscription(ownerId, plan, subscription);
  }

  async createStripePortal(ownerId: string) {
    const current = await this.findCurrent(ownerId);

    if (current.provider !== 'STRIPE' || !current.externalReference) {
      throw new BadRequestException('There is no Stripe subscription to manage.');
    }

    const stripe = this.getStripe();

    const subscription = await stripe.subscriptions.retrieve(current.externalReference);

    const customerId =
      typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${this.getWebBaseUrl()}/premium`,
    });

    return {
      url: session.url,
    };
  }

  async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      const ownerId = session.metadata?.neighbourOwnerId ?? session.client_reference_id;

      if (!ownerId || !session.subscription) {
        return;
      }

      const plan = this.readStripePlan(session.metadata?.neighbourPlan);

      const stripe = this.getStripe();

      const subscription =
        typeof session.subscription === 'string'
          ? await stripe.subscriptions.retrieve(session.subscription)
          : session.subscription;

      await this.activateStripeSubscription(ownerId, plan, subscription);

      return;
    }

    if (
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      const subscription = event.data.object as Stripe.Subscription;

      const existing = await this.database.subscription.findFirst({
        where: {
          provider: 'STRIPE',
          externalReference: subscription.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!existing) {
        return;
      }

      const plan = this.readStripePlan(
        subscription.metadata.neighbourPlan,
        existing.plan === 'FREE' ? undefined : existing.plan,
      );

      await this.activateStripeSubscription(existing.ownerId, plan, subscription);
    }
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

  async syncAppleSubscriptionTransaction(input: {
    originalTransactionId: string;
    plan: Exclude<SubscriptionPlan, 'FREE'>;
    currentPeriodEnd: Date;
    purchasedAt: Date;
    revokedAt?: Date | null;
  }): Promise<boolean> {
    const existing = await this.database.subscription.findFirst({
      where: {
        provider: 'APPLE',
        externalReference: input.originalTransactionId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!existing) {
      return false;
    }

    const revokedAt = input.revokedAt ?? null;

    const status =
      revokedAt !== null
        ? 'CANCELLED'
        : input.currentPeriodEnd <= new Date()
          ? 'EXPIRED'
          : 'ACTIVE';

    await this.database.subscription.update({
      where: {
        id: existing.id,
      },
      data: {
        plan: input.plan,
        status,
        currentPeriodEnd: input.currentPeriodEnd,
        startedAt: input.purchasedAt,
        cancelledAt: revokedAt,
      },
    });

    return true;
  }

  async expireAppleSubscription(originalTransactionId: string, expiredAt: Date): Promise<boolean> {
    const result = await this.database.subscription.updateMany({
      where: {
        provider: 'APPLE',
        externalReference: originalTransactionId,
      },
      data: {
        status: 'EXPIRED',
        currentPeriodEnd: expiredAt,
      },
    });

    return result.count > 0;
  }

  async cancelAppleSubscription(
    originalTransactionId: string,
    cancelledAt: Date,
  ): Promise<boolean> {
    const result = await this.database.subscription.updateMany({
      where: {
        provider: 'APPLE',
        externalReference: originalTransactionId,
      },
      data: {
        status: 'CANCELLED',
        cancelledAt,
      },
    });

    return result.count > 0;
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

  async getSearchResultLimit(ownerId: string): Promise<number> {
    return (await this.hasEntitlement(ownerId, 'advancedSearch')) ? 50 : 10;
  }

  async getStorageLimitBytes(ownerId: string): Promise<number> {
    return (await this.hasEntitlement(ownerId, 'enhancedStorage'))
      ? 1024 * 1024 * 1024
      : 100 * 1024 * 1024;
  }

  async submitPrioritySupport(
    ownerId: string,
    input: {
      subject: string;
      message: string;
    },
  ) {
    if (!(await this.hasEntitlement(ownerId, 'prioritySupport'))) {
      throw new ForbiddenException('Priority support requires Neighbour Plus or Business.');
    }

    const subject = input.subject.trim();
    const message = input.message.trim();

    if (!subject || !message) {
      throw new BadRequestException('A support subject and message are required.');
    }

    if (subject.length > 160 || message.length > 5000) {
      throw new BadRequestException('The support request is too long.');
    }

    return this.database.supportRequest.create({
      data: {
        userId: ownerId,
        subject,
        message,
        priority: true,
        status: 'OPEN',
      },
      select: {
        id: true,
        subject: true,
        priority: true,
        status: true,
        createdAt: true,
      },
    });
  }

  private getStripe(): Stripe {
    const secretKey = this.config.get<string>('app.stripeSecretKey')?.trim() ?? '';

    if (!secretKey) {
      throw new BadRequestException('Stripe payments are not configured.');
    }

    return new Stripe(secretKey);
  }

  private getWebBaseUrl(): string {
    const configured =
      process.env.WEB_APP_URL?.trim() ||
      process.env.CORS_ORIGINS?.split(',')
        .map((origin) => origin.trim())
        .find((origin) => /^https?:\/\//i.test(origin)) ||
      'http://localhost:3000';

    return configured.replace(/\/+$/, '');
  }

  private readStripePlan(
    value: string | undefined,
    fallback?: Exclude<SubscriptionPlan, 'FREE'>,
  ): Exclude<SubscriptionPlan, 'FREE'> {
    if (value === 'PLUS' || value === 'BUSINESS') {
      return value;
    }

    if (fallback) {
      return fallback;
    }

    throw new BadRequestException('Stripe subscription does not contain a valid Premium plan.');
  }

  private getStripePeriodEnd(subscription: Stripe.Subscription): Date | null {
    const periodEnds = subscription.items.data
      .map((item) => item.current_period_end)
      .filter((value): value is number => typeof value === 'number' && value > 0);

    if (periodEnds.length === 0) {
      return null;
    }

    return new Date(Math.max(...periodEnds) * 1_000);
  }

  private getStripeSubscriptionStatus(
    subscription: Stripe.Subscription,
  ): 'ACTIVE' | 'CANCELLED' | 'EXPIRED' {
    if (subscription.status === 'canceled') {
      return 'CANCELLED';
    }

    if (
      subscription.status === 'active' ||
      subscription.status === 'trialing' ||
      subscription.status === 'past_due'
    ) {
      return 'ACTIVE';
    }

    return 'EXPIRED';
  }

  private async activateStripeSubscription(
    ownerId: string,
    plan: Exclude<SubscriptionPlan, 'FREE'>,
    subscription: Stripe.Subscription,
  ) {
    const status = this.getStripeSubscriptionStatus(subscription);

    const periodEnd = this.getStripePeriodEnd(subscription);

    const existing = await this.database.subscription.findFirst({
      where: {
        ownerId,
        provider: 'STRIPE',
        externalReference: subscription.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

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

    const startedAt =
      subscription.start_date > 0 ? new Date(subscription.start_date * 1_000) : new Date();

    const cancelledAt =
      status === 'CANCELLED'
        ? new Date((subscription.canceled_at ?? Math.floor(Date.now() / 1_000)) * 1_000)
        : null;

    const record = existing
      ? await this.database.subscription.update({
          where: {
            id: existing.id,
          },
          data: {
            plan,
            status,
            provider: 'STRIPE',
            currentPeriodEnd: periodEnd,
            startedAt,
            cancelledAt,
          },
        })
      : await this.database.subscription.create({
          data: {
            ownerId,
            plan,
            status,
            provider: 'STRIPE',
            externalReference: subscription.id,
            currentPeriodEnd: periodEnd,
            startedAt,
            cancelledAt,
          },
        });

    return this.overview(record);
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
