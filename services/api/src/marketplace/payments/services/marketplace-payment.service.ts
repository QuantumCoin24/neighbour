import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type Stripe from 'stripe';

import { DatabaseService } from '../../../database/database.service';
import {
  MarketplacePaymentEventType,
  MarketplacePaymentMethod,
  MarketplacePaymentProvider,
  MarketplacePaymentStatus,
  MarketplaceRefundStatus,
  MarketplaceTransactionStatus,
  NotificationType,
  Prisma,
} from '../../../generated/prisma/client';

import type { CancelMarketplacePaymentDto } from '../dto/cancel-marketplace-payment.dto';
import type { ConfirmMarketplacePaymentDto } from '../dto/confirm-marketplace-payment.dto';
import type { CreateMarketplacePaymentDto } from '../dto/create-marketplace-payment.dto';
import type { CreateMarketplaceRefundDto } from '../dto/create-marketplace-refund.dto';
import type {
  MarketplacePaymentHealthResponse,
  MarketplacePaymentResponse,
} from '../interfaces/marketplace-payment-response.interface';
import { ManualPaymentProvider } from '../providers/manual-payment.provider';
import { StripePaymentProvider } from '../providers/stripe-payment.provider';

const paymentInclude = {
  events: {
    orderBy: {
      createdAt: 'asc',
    },
  },
  refunds: {
    orderBy: {
      createdAt: 'asc',
    },
  },
} satisfies Prisma.MarketplacePaymentInclude;

type PaymentWithRelations = Prisma.MarketplacePaymentGetPayload<{
  include: typeof paymentInclude;
}>;

const TERMINAL_STATUSES: MarketplacePaymentStatus[] = [
  MarketplacePaymentStatus.CANCELLED,
  MarketplacePaymentStatus.REFUNDED,
  MarketplacePaymentStatus.FAILED,
];

const MARKETPLACE_PLATFORM_FEE_BASIS_POINTS = 750;
const BASIS_POINTS_DIVISOR = 10_000;

function calculateMarketplaceCommission(amountPence: number) {
  const platformFeePence = Math.round(
    (amountPence * MARKETPLACE_PLATFORM_FEE_BASIS_POINTS) / BASIS_POINTS_DIVISOR,
  );

  const processorFeePence = 0;
  const sellerProceedsPence = amountPence - platformFeePence - processorFeePence;

  return {
    platformFeeBasisPoints: MARKETPLACE_PLATFORM_FEE_BASIS_POINTS,
    platformFeePence,
    processorFeePence,
    sellerProceedsPence,
  };
}

@Injectable()
export class MarketplacePaymentService {
  constructor(
    private readonly database: DatabaseService,
    private readonly manualProvider: ManualPaymentProvider,
    private readonly stripeProvider: StripePaymentProvider,
  ) {}

  getHealth(): MarketplacePaymentHealthResponse {
    return {
      service: 'Marketplace PaymentOS',
      status: 'READY',
      architecture: 'PROVIDER_NEUTRAL',
      currency: 'GBP',
    };
  }

  getSupportedMethods() {
    return {
      currency: 'GBP' as const,
      methods: [
        {
          id: MarketplacePaymentMethod.CASH_ON_COLLECTION,
          provider: MarketplacePaymentProvider.MANUAL,
          enabled: true,
        },
        {
          id: MarketplacePaymentMethod.BANK_TRANSFER,
          provider: MarketplacePaymentProvider.MANUAL,
          enabled: true,
        },
        {
          id: MarketplacePaymentMethod.CARD,
          provider: MarketplacePaymentProvider.STRIPE,
          enabled: this.stripeProvider.isConfigured(),
        },
        {
          id: MarketplacePaymentMethod.APPLE_PAY,
          provider: MarketplacePaymentProvider.STRIPE,
          enabled: this.stripeProvider.isConfigured(),
        },
        {
          id: MarketplacePaymentMethod.QFN,
          provider: MarketplacePaymentProvider.QFN,
          enabled: false,
        },
      ],
    };
  }

  async create(
    userId: string,
    dto: CreateMarketplacePaymentDto,
  ): Promise<MarketplacePaymentResponse> {
    const transaction = await this.database.marketplaceTransaction.findFirst({
      where: {
        id: dto.transactionId,
        buyerId: userId,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Marketplace transaction not found.');
    }

    if (
      transaction.status === MarketplaceTransactionStatus.COMPLETED ||
      transaction.status === MarketplaceTransactionStatus.CANCELLED
    ) {
      throw new ConflictException('Payment cannot be created for this transaction.');
    }

    if (dto.amountPence !== transaction.agreedPricePence) {
      throw new BadRequestException('Payment amount must equal the agreed transaction price.');
    }

    const method = dto.method as MarketplacePaymentMethod;

    const isManualMethod =
      method === MarketplacePaymentMethod.CASH_ON_COLLECTION ||
      method === MarketplacePaymentMethod.BANK_TRANSFER;

    const isStripeMethod =
      method === MarketplacePaymentMethod.CARD ||
      method === MarketplacePaymentMethod.APPLE_PAY;

    if (!isManualMethod && !isStripeMethod) {
      throw new BadRequestException('This payment method is not enabled yet.');
    }

    if (isStripeMethod && !this.stripeProvider.isConfigured()) {
      throw new BadRequestException('Stripe payments are not configured.');
    }

    const provider = isStripeMethod
      ? MarketplacePaymentProvider.STRIPE
      : MarketplacePaymentProvider.MANUAL;

    const existing = await this.database.marketplacePayment.findFirst({
      where: {
        transactionId: transaction.id,
        status: {
          notIn: TERMINAL_STATUSES,
        },
      },
      include: paymentInclude,
    });

    if (existing) {
      return this.map(existing);
    }

    const idempotencyKey = `marketplace-payment:${transaction.id}:${method}`;

    const commission = calculateMarketplaceCommission(dto.amountPence);

    const created = await this.database.$transaction(async (databaseTransaction) => {
      const payment = await databaseTransaction.marketplacePayment.create({
        data: {
          transactionId: transaction.id,
          buyerId: transaction.buyerId,
          sellerId: transaction.sellerId,
          provider,
          method,
          status: isStripeMethod
            ? MarketplacePaymentStatus.REQUIRES_ACTION
            : MarketplacePaymentStatus.PENDING,
          amountPence: dto.amountPence,
          platformFeeBasisPoints: commission.platformFeeBasisPoints,
          platformFeePence: commission.platformFeePence,
          processorFeePence: commission.processorFeePence,
          sellerProceedsPence: commission.sellerProceedsPence,
          currency: 'GBP',
          manualReference: dto.reference?.trim() || null,
          idempotencyKey,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1_000),
        },
      });

      await databaseTransaction.marketplacePaymentEvent.create({
        data: {
          paymentId: payment.id,
          actorId: userId,
          type: MarketplacePaymentEventType.CREATED,
          toStatus: MarketplacePaymentStatus.PENDING,
          amountPence: payment.amountPence,
          note: 'Marketplace payment created.',
        },
      });

      return databaseTransaction.marketplacePayment.findUniqueOrThrow({
        where: {
          id: payment.id,
        },
        include: paymentInclude,
      });
    });

    const providerAdapter = isStripeMethod
      ? this.stripeProvider
      : this.manualProvider;

    const providerResult = await providerAdapter.createPayment({
      paymentId: created.id,
      transactionId: created.transactionId,
      buyerId: created.buyerId,
      sellerId: created.sellerId,
      amountPence: created.amountPence,
      currency: 'GBP',
      method: created.method,
    });

    const finalPayment =
      provider === MarketplacePaymentProvider.STRIPE
        ? await this.database.marketplacePayment.update({
            where: {
              id: created.id,
            },
            data: {
              provider: providerResult.provider,
              providerReference: providerResult.providerReference,
              clientSecret: providerResult.clientSecret,
              status: providerResult.requiresAction
                ? MarketplacePaymentStatus.REQUIRES_ACTION
                : MarketplacePaymentStatus.AUTHORISED,
            },
            include: paymentInclude,
          })
        : created;

    await this.notify(finalPayment.sellerId, userId, finalPayment.id, 'created');

    return this.map(finalPayment);
  }

  async listMine(userId: string): Promise<MarketplacePaymentResponse[]> {
    const payments = await this.database.marketplacePayment.findMany({
      where: {
        OR: [
          {
            buyerId: userId,
          },
          {
            sellerId: userId,
          },
        ],
      },
      include: paymentInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return payments.map((payment) => this.map(payment));
  }

  async findOne(userId: string, paymentId: string): Promise<MarketplacePaymentResponse> {
    return this.map(await this.requireParticipant(userId, paymentId));
  }

  async confirm(
    userId: string,
    paymentId: string,
    dto: ConfirmMarketplacePaymentDto,
  ): Promise<MarketplacePaymentResponse> {
    const payment = await this.requireParticipant(userId, paymentId);

    if (payment.sellerId !== userId) {
      throw new ForbiddenException('Only the seller may confirm receipt of payment.');
    }

    if (payment.provider !== MarketplacePaymentProvider.MANUAL) {
      throw new ConflictException(
        'Provider-managed payments cannot be manually confirmed.',
      );
    }

    if (payment.status === MarketplacePaymentStatus.CAPTURED) {
      return this.map(payment);
    }

    if (
      payment.status !== MarketplacePaymentStatus.PENDING &&
      payment.status !== MarketplacePaymentStatus.AUTHORISED
    ) {
      throw new ConflictException('This payment cannot be confirmed.');
    }

    const capturedAt = new Date();

    const updated = await this.database.$transaction(async (databaseTransaction) => {
      await databaseTransaction.marketplacePayment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: MarketplacePaymentStatus.CAPTURED,
          providerReference: dto.providerReference?.trim() || payment.providerReference,
          authorisedAt: payment.authorisedAt ?? capturedAt,
          capturedAt,
        },
      });

      await databaseTransaction.marketplacePaymentEvent.create({
        data: {
          paymentId: payment.id,
          actorId: userId,
          type: MarketplacePaymentEventType.CAPTURED,
          fromStatus: payment.status,
          toStatus: MarketplacePaymentStatus.CAPTURED,
          amountPence: payment.amountPence,
          note: 'Seller confirmed payment receipt.',
        },
      });

      return databaseTransaction.marketplacePayment.findUniqueOrThrow({
        where: {
          id: payment.id,
        },
        include: paymentInclude,
      });
    });

    await this.notify(payment.buyerId, userId, payment.id, 'captured');

    return this.map(updated);
  }

  async cancel(
    userId: string,
    paymentId: string,
    dto: CancelMarketplacePaymentDto,
  ): Promise<MarketplacePaymentResponse> {
    const payment = await this.requireParticipant(userId, paymentId);

    if (
      payment.status === MarketplacePaymentStatus.CAPTURED ||
      payment.status === MarketplacePaymentStatus.PARTIALLY_REFUNDED ||
      payment.status === MarketplacePaymentStatus.REFUNDED
    ) {
      throw new ConflictException('Captured payments must use the refund workflow.');
    }

    if (payment.status === MarketplacePaymentStatus.CANCELLED) {
      return this.map(payment);
    }

    if (
      payment.provider === MarketplacePaymentProvider.STRIPE &&
      payment.providerReference
    ) {
      await this.stripeProvider.cancelPayment(payment.providerReference);
    }

    const cancelledAt = new Date();

    const updated = await this.database.$transaction(async (databaseTransaction) => {
      await databaseTransaction.marketplacePayment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: MarketplacePaymentStatus.CANCELLED,
          cancelledAt,
        },
      });

      await databaseTransaction.marketplacePaymentEvent.create({
        data: {
          paymentId: payment.id,
          actorId: userId,
          type: MarketplacePaymentEventType.CANCELLED,
          fromStatus: payment.status,
          toStatus: MarketplacePaymentStatus.CANCELLED,
          amountPence: payment.amountPence,
          note: dto.reason.trim(),
        },
      });

      return databaseTransaction.marketplacePayment.findUniqueOrThrow({
        where: {
          id: payment.id,
        },
        include: paymentInclude,
      });
    });

    await this.notifyOtherParticipant(payment, userId, 'cancelled');

    return this.map(updated);
  }

  async refund(
    userId: string,
    paymentId: string,
    dto: CreateMarketplaceRefundDto,
  ): Promise<MarketplacePaymentResponse> {
    const payment = await this.requireParticipant(userId, paymentId);

    if (payment.sellerId !== userId) {
      throw new ForbiddenException('Only the seller may issue a refund.');
    }

    if (
      payment.status !== MarketplacePaymentStatus.CAPTURED &&
      payment.status !== MarketplacePaymentStatus.PARTIALLY_REFUNDED
    ) {
      throw new ConflictException('Only captured payments may be refunded.');
    }

    const refundable = payment.amountPence - payment.refundedAmountPence;

    if (dto.amountPence > refundable) {
      throw new BadRequestException('Refund amount exceeds the remaining captured balance.');
    }

    let providerRefundReference: string | null = null;

    if (
      payment.provider === MarketplacePaymentProvider.STRIPE &&
      payment.providerReference
    ) {
      providerRefundReference = await this.stripeProvider.refundPayment(
        payment.providerReference,
        dto.amountPence,
      );
    }

    const nextRefundedAmount = payment.refundedAmountPence + dto.amountPence;

    const nextStatus =
      nextRefundedAmount === payment.amountPence
        ? MarketplacePaymentStatus.REFUNDED
        : MarketplacePaymentStatus.PARTIALLY_REFUNDED;

    const now = new Date();

    const updated = await this.database.$transaction(async (databaseTransaction) => {
      const refund = await databaseTransaction.marketplaceRefund.create({
        data: {
          paymentId: payment.id,
          requestedById: userId,
          status: MarketplaceRefundStatus.COMPLETED,
          amountPence: dto.amountPence,
          reason: dto.reason?.trim() || null,
          providerReference: providerRefundReference,
          completedAt: now,
        },
      });

      await databaseTransaction.marketplacePayment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: nextStatus,
          refundedAmountPence: nextRefundedAmount,
        },
      });

      await databaseTransaction.marketplacePaymentEvent.create({
        data: {
          paymentId: payment.id,
          actorId: userId,
          type: MarketplacePaymentEventType.REFUND_COMPLETED,
          fromStatus: payment.status,
          toStatus: nextStatus,
          amountPence: dto.amountPence,
          note: dto.reason?.trim() || 'Marketplace refund completed.',
          metadata: {
            refundId: refund.id,
            providerReference: providerRefundReference,
          },
        },
      });

      return databaseTransaction.marketplacePayment.findUniqueOrThrow({
        where: {
          id: payment.id,
        },
        include: paymentInclude,
      });
    });

    await this.notify(payment.buyerId, userId, payment.id, 'refunded');

    return this.map(updated);
  }

  private async requireParticipant(
    userId: string,
    paymentId: string,
  ): Promise<PaymentWithRelations> {
    const payment = await this.database.marketplacePayment.findFirst({
      where: {
        id: paymentId,
        OR: [
          {
            buyerId: userId,
          },
          {
            sellerId: userId,
          },
        ],
      },
      include: paymentInclude,
    });

    if (!payment) {
      throw new NotFoundException('Marketplace payment not found.');
    }

    return payment;
  }

  private async notifyOtherParticipant(
    payment: PaymentWithRelations,
    actorId: string,
    event: string,
  ): Promise<void> {
    const recipientId = actorId === payment.buyerId ? payment.sellerId : payment.buyerId;

    await this.notify(recipientId, actorId, payment.id, event);
  }

  private async notify(
    recipientId: string,
    actorId: string,
    paymentId: string,
    event: string,
  ): Promise<void> {
    if (recipientId === actorId) {
      return;
    }

    const idempotencyKey = `marketplace-payment:${paymentId}:${event}:${recipientId}`;

    await this.database.notification.upsert({
      where: {
        idempotencyKey,
      },
      create: {
        recipientId,
        actorId,
        type: NotificationType.MARKETPLACE_TRANSACTION,
        idempotencyKey,
      },
      update: {
        readAt: null,
        dismissedAt: null,
      },
    });
  }

  async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    const object = event.data.object as Stripe.PaymentIntent;
    const providerReference = object.id;

    if (!providerReference) {
      return;
    }

    /*
     * Stripe guarantees that an Event has a stable unique ID.
     *
     * Persist that ID before applying any payment mutation. The unique
     * constraint makes duplicate webhook deliveries safe even when two
     * copies arrive concurrently.
     */
    try {
      await this.database.stripeWebhookEvent.create({
        data: {
          stripeEventId: event.id,
          type: event.type,
          providerObjectId: providerReference,
        },
      });
    } catch (error) {
      const candidate = error as { code?: string };

      if (candidate?.code === 'P2002') {
        return;
      }

      throw error;
    }

    if (
      event.type !== 'payment_intent.succeeded' &&
      event.type !== 'payment_intent.payment_failed' &&
      event.type !== 'payment_intent.canceled'
    ) {
      return;
    }

    const payment = await this.database.marketplacePayment.findFirst({
      where: {
        provider: MarketplacePaymentProvider.STRIPE,
        providerReference,
      },
    });

    if (!payment) {
      return;
    }

    const now = new Date();

    if (event.type === 'payment_intent.succeeded') {
      if (payment.status === MarketplacePaymentStatus.CAPTURED) {
        return;
      }

      await this.database.$transaction(async (databaseTransaction) => {
        await databaseTransaction.marketplacePayment.update({
          where: {
            id: payment.id,
          },
          data: {
            status: MarketplacePaymentStatus.CAPTURED,
            authorisedAt: payment.authorisedAt ?? now,
            capturedAt: payment.capturedAt ?? now,
            failureReason: null,
          },
        });

        await databaseTransaction.marketplaceSettlement.upsert({
          where: {
            paymentId: payment.id,
          },
          create: {
            paymentId: payment.id,
            transactionId: payment.transactionId,
            sellerId: payment.sellerId,
            status: 'PENDING',
            grossAmountPence: payment.amountPence,
            platformFeePence: payment.platformFeePence,
            processorFeePence: payment.processorFeePence,
            sellerProceedsPence: payment.sellerProceedsPence,
            refundedAmountPence: payment.refundedAmountPence,
            currency: payment.currency,
            provider: payment.provider,
            providerReference: payment.providerReference,
            capturedAt: payment.capturedAt ?? now,
          },
          update: {
            refundedAmountPence: payment.refundedAmountPence,
            providerReference: payment.providerReference,
          },
        });

        await databaseTransaction.marketplacePaymentEvent.create({
          data: {
            paymentId: payment.id,
            actorId: payment.buyerId,
            type: MarketplacePaymentEventType.CAPTURED,
            fromStatus: payment.status,
            toStatus: MarketplacePaymentStatus.CAPTURED,
            amountPence: payment.amountPence,
            note: 'Stripe confirmed payment capture.',
            metadata: {
              stripeEventId: event.id,
              providerReference,
            },
          },
        });
      });

      await this.notify(
        payment.sellerId,
        payment.buyerId,
        payment.id,
        'captured',
      );

      return;
    }

    if (event.type === 'payment_intent.payment_failed') {
      if (payment.status === MarketplacePaymentStatus.FAILED) {
        return;
      }

      await this.database.$transaction(async (databaseTransaction) => {
        await databaseTransaction.marketplacePayment.update({
          where: {
            id: payment.id,
          },
          data: {
            status: MarketplacePaymentStatus.FAILED,
            failureReason:
              object.last_payment_error?.message ??
              'Stripe reported that the payment failed.',
          },
        });

      });

      return;
    }

    if (event.type === 'payment_intent.canceled') {
      if (payment.status === MarketplacePaymentStatus.CANCELLED) {
        return;
      }

      await this.database.$transaction(async (databaseTransaction) => {
        await databaseTransaction.marketplacePayment.update({
          where: {
            id: payment.id,
          },
          data: {
            status: MarketplacePaymentStatus.CANCELLED,
            cancelledAt: payment.cancelledAt ?? now,
          },
        });

      });
    }
  }

  private map(payment: PaymentWithRelations): MarketplacePaymentResponse {
    return {
      id: payment.id,
      transactionId: payment.transactionId,
      buyerId: payment.buyerId,
      sellerId: payment.sellerId,
      provider: payment.provider,
      method: payment.method,
      status: payment.status,
      amountPence: payment.amountPence,
      platformFeeBasisPoints: payment.platformFeeBasisPoints,
      platformFeePence: payment.platformFeePence,
      processorFeePence: payment.processorFeePence,
      sellerProceedsPence: payment.sellerProceedsPence,
      currency: payment.currency,
      providerReference: payment.providerReference,
      clientSecret: payment.clientSecret,
      manualReference: payment.manualReference,
      failureReason: payment.failureReason,
      authorisedAt: payment.authorisedAt,
      capturedAt: payment.capturedAt,
      cancelledAt: payment.cancelledAt,
      refundedAmountPence: payment.refundedAmountPence,
      expiresAt: payment.expiresAt,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      events: payment.events.map((event) => ({
        id: event.id,
        actorId: event.actorId,
        type: event.type,
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
        amountPence: event.amountPence,
        note: event.note,
        metadata:
          event.metadata && typeof event.metadata === 'object' && !Array.isArray(event.metadata)
            ? (event.metadata as Record<string, unknown>)
            : null,
        createdAt: event.createdAt,
      })),
      refunds: payment.refunds,
    };
  }
}
