import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

import type {
  CreateProviderPaymentInput,
  CreateProviderPaymentResult,
  MarketplacePaymentProviderAdapter,
} from './marketplace-payment-provider.interface';

@Injectable()
export class StripePaymentProvider implements MarketplacePaymentProviderAdapter {
  readonly provider = 'STRIPE' as const;

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.getSecretKey());
  }

  async createPayment(
    input: CreateProviderPaymentInput,
  ): Promise<CreateProviderPaymentResult> {
    const stripe = this.getStripe();

    const intent = await stripe.paymentIntents.create(
      {
        amount: input.amountPence,
        currency: input.currency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          marketplacePaymentId: input.paymentId,
          marketplaceTransactionId: input.transactionId,
          buyerId: input.buyerId,
          sellerId: input.sellerId,
          marketplaceMethod: input.method,
        },
      },
      {
        idempotencyKey: `marketplace-payment:${input.paymentId}`,
      },
    );

    return {
      provider: this.provider,
      providerReference: intent.id,
      clientSecret: intent.client_secret ?? null,
      requiresAction: intent.status !== 'succeeded',
    };
  }

  async capturePayment(providerReference: string): Promise<void> {
    const stripe = this.getStripe();

    const intent = await stripe.paymentIntents.retrieve(providerReference);

    if (intent.status === 'succeeded') {
      return;
    }

    if (intent.status === 'requires_capture') {
      await stripe.paymentIntents.capture(providerReference);
      return;
    }

    throw new Error(
      `Stripe PaymentIntent ${providerReference} cannot be captured from status ${intent.status}.`,
    );
  }

  async cancelPayment(providerReference: string): Promise<void> {
    const stripe = this.getStripe();

    const intent = await stripe.paymentIntents.retrieve(providerReference);

    if (intent.status === 'canceled') {
      return;
    }

    await stripe.paymentIntents.cancel(providerReference);
  }

  async refundPayment(
    providerReference: string,
    amountPence: number,
  ): Promise<string> {
    const stripe = this.getStripe();

    const refund = await stripe.refunds.create({
      payment_intent: providerReference,
      amount: amountPence,
    });

    return refund.id;
  }

  constructWebhookEvent(
    payload: Buffer,
    signature: string,
  ): Stripe.Event {
    const webhookSecret =
      this.config.get<string>('app.stripeWebhookSecret')?.trim() ?? '';

    if (!webhookSecret) {
      throw new Error('Stripe webhook secret is not configured.');
    }

    return this.getStripe().webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );
  }

  private getSecretKey(): string {
    return this.config.get<string>('app.stripeSecretKey')?.trim() ?? '';
  }

  private getStripe(): Stripe {
    const secretKey = this.getSecretKey();

    if (!secretKey) {
      throw new Error('Stripe is not configured.');
    }

    return new Stripe(secretKey);
  }
}
