import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

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

@Injectable()
export class MarketplacePaymentService {
  constructor(
    private readonly database: DatabaseService,
    private readonly manualProvider: ManualPaymentProvider,
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
          enabled: false,
        },
        {
          id: MarketplacePaymentMethod.APPLE_PAY,
          provider: MarketplacePaymentProvider.STRIPE,
          enabled: false,
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

    if (
      method !== MarketplacePaymentMethod.CASH_ON_COLLECTION &&
      method !== MarketplacePaymentMethod.BANK_TRANSFER
    ) {
      throw new BadRequestException('This payment method is not enabled yet.');
    }

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

    const created = await this.database.$transaction(async (databaseTransaction) => {
      const payment = await databaseTransaction.marketplacePayment.create({
        data: {
          transactionId: transaction.id,
          buyerId: transaction.buyerId,
          sellerId: transaction.sellerId,
          provider: MarketplacePaymentProvider.MANUAL,
          method,
          status: MarketplacePaymentStatus.PENDING,
          amountPence: dto.amountPence,
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

    await this.manualProvider.createPayment({
      paymentId: created.id,
      transactionId: created.transactionId,
      buyerId: created.buyerId,
      sellerId: created.sellerId,
      amountPence: created.amountPence,
      currency: 'GBP',
      method: created.method,
    });

    await this.notify(created.sellerId, userId, created.id, 'created');

    return this.map(created);
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
