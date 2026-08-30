import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { ContentSafetyService } from '../../../common/content-safety/content-safety.service';
import { DatabaseService } from '../../../database/database.service';
import { MessageService } from '../../../message/message.service';
import {
  ConversationType,
  MarketplaceListingStatus,
  MarketplaceOfferStatus,
  MarketplaceTransactionStatus,
  MessageType,
  NotificationType,
  Prisma,
} from '../../../generated/prisma/client';

import type { CounterMarketplaceOfferDto } from '../dto/counter-marketplace-offer.dto';
import type { CreateMarketplaceOfferDto } from '../dto/create-marketplace-offer.dto';
import type { MarketplaceOfferQueryDto } from '../dto/marketplace-offer-query.dto';
import type {
  MarketplaceOfferListResponse,
  MarketplaceOfferResponse,
  MarketplaceTransactionResponse,
} from '../interfaces/marketplace-transaction-response.interface';

const ACTIVE_OFFER_STATUSES: MarketplaceOfferStatus[] = [
  MarketplaceOfferStatus.PENDING,
  MarketplaceOfferStatus.COUNTERED,
];

const offerInclude = {
  buyer: {
    include: {
      profile: true,
    },
  },
  seller: {
    include: {
      profile: true,
    },
  },
  listing: {
    include: {
      media: {
        where: {
          media: {
            status: 'READY',
            deletedAt: null,
          },
        },
        include: {
          media: true,
        },
        orderBy: {
          position: 'asc',
        },
        take: 1,
      },
    },
  },
  history: {
    orderBy: {
      createdAt: 'asc',
    },
  },
  transaction: true,
} satisfies Prisma.MarketplaceOfferInclude;

type OfferWithRelations = Prisma.MarketplaceOfferGetPayload<{
  include: typeof offerInclude;
}>;

@Injectable()
export class MarketplaceTransactionService {
  private readonly logger = new Logger(MarketplaceTransactionService.name);

  constructor(
    private readonly database: DatabaseService,
    private readonly messages: MessageService,
    private readonly contentSafety: ContentSafetyService,
  ) {}

  async createOffer(
    buyerId: string,
    listingId: string,
    dto: CreateMarketplaceOfferDto,
  ): Promise<MarketplaceOfferResponse> {
    this.contentSafety.assertAcceptable({
      field: 'message',
      value: dto.message,
    });

    await this.expireStaleMarketplaceState();
    const listing = await this.database.marketplaceListing.findFirst({
      where: {
        id: listingId,
        status: MarketplaceListingStatus.PUBLISHED,
        deletedAt: null,
      },
      select: {
        id: true,
        sellerId: true,
        acceptsOffers: true,
        isFree: true,
      },
    });

    if (!listing) {
      throw new NotFoundException('Marketplace listing not found.');
    }

    if (listing.sellerId === buyerId) {
      throw new ForbiddenException('You cannot make an offer on your own listing.');
    }

    if (!listing.acceptsOffers) {
      throw new BadRequestException('This listing is not accepting offers.');
    }

    if (listing.isFree) {
      throw new BadRequestException('Offers cannot be made on a free listing.');
    }

    await this.requireNoBlockRelationship(buyerId, listing.sellerId);

    const existing = await this.database.marketplaceOffer.findFirst({
      where: {
        listingId,
        buyerId,
        status: {
          in: ACTIVE_OFFER_STATUSES,
        },
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      throw new ConflictException('You already have an active offer for this listing.');
    }

    const expiresAt = this.resolveExpiry(dto.expiresInDays);

    const offer = await this.database.$transaction(async (transaction) => {
      const created = await transaction.marketplaceOffer.create({
        data: {
          listingId,
          buyerId,
          sellerId: listing.sellerId,
          amountPence: dto.amountPence,
          expiresAt,
          ...(dto.message !== undefined
            ? {
                message: dto.message.trim() || null,
              }
            : {}),
        },
      });

      await transaction.marketplaceOfferHistory.create({
        data: {
          offerId: created.id,
          actorId: buyerId,
          toStatus: MarketplaceOfferStatus.PENDING,
          amountPence: dto.amountPence,
          note: dto.message?.trim() || 'Offer created.',
        },
      });

      return transaction.marketplaceOffer.findUniqueOrThrow({
        where: {
          id: created.id,
        },
        include: offerInclude,
      });
    });

    await this.createMarketplaceNotification(
      listing.sellerId,
      buyerId,
      NotificationType.MARKETPLACE_OFFER,
      `marketplace-offer:${offer.id}`,
    );

    return this.mapOffer(offer);
  }

  async counterOffer(
    userId: string,
    offerId: string,
    dto: CounterMarketplaceOfferDto,
  ): Promise<MarketplaceOfferResponse> {
    this.contentSafety.assertAcceptable({
      field: 'message',
      value: dto.message,
    });

    const current = await this.requireParticipatingOffer(userId, offerId);

    this.requireActiveOffer(current);

    const latestActorId = current.history.at(-1)?.actorId ?? null;

    if (latestActorId === userId) {
      throw new ConflictException('You must wait for the other party to respond.');
    }

    const expiresAt = this.resolveExpiry(dto.expiresInDays);

    const counter = await this.database.$transaction(async (transaction) => {
      await transaction.marketplaceOffer.update({
        where: {
          id: current.id,
        },
        data: {
          status: MarketplaceOfferStatus.COUNTERED,
        },
      });

      await transaction.marketplaceOfferHistory.create({
        data: {
          offerId: current.id,
          actorId: userId,
          fromStatus: current.status,
          toStatus: MarketplaceOfferStatus.COUNTERED,
          amountPence: dto.amountPence,
          note: 'Counter offer created.',
        },
      });

      const created = await transaction.marketplaceOffer.create({
        data: {
          listingId: current.listingId,
          buyerId: current.buyerId,
          sellerId: current.sellerId,
          parentOfferId: current.id,
          amountPence: dto.amountPence,
          expiresAt,
          ...(dto.message !== undefined
            ? {
                message: dto.message.trim() || null,
              }
            : {}),
        },
      });

      await transaction.marketplaceOfferHistory.create({
        data: {
          offerId: created.id,
          actorId: userId,
          toStatus: MarketplaceOfferStatus.PENDING,
          amountPence: dto.amountPence,
          note: dto.message?.trim() || 'Counter offer created.',
        },
      });

      return transaction.marketplaceOffer.findUniqueOrThrow({
        where: {
          id: created.id,
        },
        include: offerInclude,
      });
    });

    const counterRecipientId = userId === counter.buyerId ? counter.sellerId : counter.buyerId;

    await this.createMarketplaceNotification(
      counterRecipientId,
      userId,
      NotificationType.MARKETPLACE_OFFER_COUNTERED,
      `marketplace-offer-countered:${counter.id}`,
    );

    return this.mapOffer(counter);
  }

  async purchaseListing(
    buyerId: string,
    listingId: string,
  ): Promise<MarketplaceTransactionResponse> {
    await this.expireStaleMarketplaceState();

    const listing = await this.database.marketplaceListing.findFirst({
      where: {
        id: listingId,
        status: MarketplaceListingStatus.PUBLISHED,
        deletedAt: null,
      },
      select: {
        id: true,
        sellerId: true,
        pricePence: true,
        isFree: true,
      },
    });

    if (!listing) {
      throw new NotFoundException('Marketplace listing not found.');
    }

    if (listing.sellerId === buyerId) {
      throw new ForbiddenException('You cannot purchase your own listing.');
    }

    if (listing.isFree || listing.pricePence === null || listing.pricePence <= 0) {
      throw new BadRequestException('This listing is not available for direct purchase.');
    }

    const agreedPricePence = listing.pricePence;

    await this.requireNoBlockRelationship(buyerId, listing.sellerId);

    const reservedAt = new Date();

    const created = await this.database.$transaction(async (transaction) => {
      const existingTransaction = await transaction.marketplaceTransaction.findFirst({
        where: {
          listingId,
          status: {
            in: [
              MarketplaceTransactionStatus.RESERVED,
              MarketplaceTransactionStatus.COLLECTION_PENDING,
              MarketplaceTransactionStatus.DELIVERY_PENDING,
            ],
          },
        },
        select: {
          id: true,
        },
      });

      if (existingTransaction) {
        throw new ConflictException('A transaction already exists for this listing.');
      }

      const reserved = await transaction.marketplaceListing.updateMany({
        where: {
          id: listingId,
          status: MarketplaceListingStatus.PUBLISHED,
          deletedAt: null,
        },
        data: {
          status: MarketplaceListingStatus.RESERVED,
          reservedAt,
        },
      });

      if (reserved.count !== 1) {
        throw new ConflictException('This listing is no longer available.');
      }

      const activeOffers = await transaction.marketplaceOffer.findMany({
        where: {
          listingId,
          status: {
            in: ACTIVE_OFFER_STATUSES,
          },
        },
        select: {
          id: true,
          status: true,
        },
      });

      for (const offer of activeOffers) {
        await transaction.marketplaceOffer.update({
          where: {
            id: offer.id,
          },
          data: {
            status: MarketplaceOfferStatus.CANCELLED,
            cancelledAt: reservedAt,
          },
        });

        await transaction.marketplaceOfferHistory.create({
          data: {
            offerId: offer.id,
            actorId: buyerId,
            fromStatus: offer.status,
            toStatus: MarketplaceOfferStatus.CANCELLED,
            note: 'Listing purchased at the asking price.',
          },
        });
      }

      return transaction.marketplaceTransaction.create({
        data: {
          listingId,
          buyerId,
          sellerId: listing.sellerId,
          agreedPricePence,
          status: MarketplaceTransactionStatus.RESERVED,
          reservedAt,
          expiresAt: new Date(reservedAt.getTime() + 7 * 24 * 60 * 60 * 1_000),
        },
      });
    });

    await this.attachTransactionConversationSafely(
      buyerId,
      buyerId,
      listing.sellerId,
      listingId,
      created.id,
      created.agreedPricePence,
    );

    return this.database.marketplaceTransaction.findUniqueOrThrow({
      where: {
        id: created.id,
      },
    });
  }

  async acceptOffer(userId: string, offerId: string): Promise<MarketplaceOfferResponse> {
    const offer = await this.requireParticipatingOffer(userId, offerId);

    this.requireActiveOffer(offer);

    const latestActorId = offer.history.at(-1)?.actorId ?? null;

    if (latestActorId === userId) {
      throw new ConflictException('You cannot accept your own offer action.');
    }

    if (offer.listing.status !== MarketplaceListingStatus.PUBLISHED) {
      throw new ConflictException('This listing is no longer available.');
    }

    const updated = await this.database.$transaction(async (transaction) => {
      const existingTransaction = await transaction.marketplaceTransaction.findFirst({
        where: {
          listingId: offer.listingId,
          status: {
            in: [
              MarketplaceTransactionStatus.RESERVED,
              MarketplaceTransactionStatus.COLLECTION_PENDING,
              MarketplaceTransactionStatus.DELIVERY_PENDING,
            ],
          },
        },
        select: {
          id: true,
        },
      });

      if (existingTransaction) {
        throw new ConflictException('A transaction already exists for this listing.');
      }

      const acceptedAt = new Date();

      await transaction.marketplaceOffer.update({
        where: {
          id: offer.id,
        },
        data: {
          status: MarketplaceOfferStatus.ACCEPTED,
          acceptedAt,
        },
      });

      await transaction.marketplaceOfferHistory.create({
        data: {
          offerId: offer.id,
          actorId: userId,
          fromStatus: offer.status,
          toStatus: MarketplaceOfferStatus.ACCEPTED,
          amountPence: offer.amountPence,
          note: 'Offer accepted.',
        },
      });

      const otherOffers = await transaction.marketplaceOffer.findMany({
        where: {
          listingId: offer.listingId,
          id: {
            not: offer.id,
          },
          status: {
            in: ACTIVE_OFFER_STATUSES,
          },
        },
        select: {
          id: true,
          status: true,
        },
      });

      for (const other of otherOffers) {
        await transaction.marketplaceOffer.update({
          where: {
            id: other.id,
          },
          data: {
            status: MarketplaceOfferStatus.CANCELLED,
            cancelledAt: acceptedAt,
          },
        });

        await transaction.marketplaceOfferHistory.create({
          data: {
            offerId: other.id,
            actorId: userId,
            fromStatus: other.status,
            toStatus: MarketplaceOfferStatus.CANCELLED,
            note: 'Another offer was accepted.',
          },
        });
      }

      await transaction.marketplaceListing.update({
        where: {
          id: offer.listingId,
        },
        data: {
          status: MarketplaceListingStatus.RESERVED,
          reservedAt: acceptedAt,
        },
      });

      await transaction.marketplaceTransaction.create({
        data: {
          listingId: offer.listingId,
          acceptedOfferId: offer.id,
          buyerId: offer.buyerId,
          sellerId: offer.sellerId,
          agreedPricePence: offer.amountPence,
          status: MarketplaceTransactionStatus.RESERVED,
          reservedAt: acceptedAt,
          expiresAt: new Date(acceptedAt.getTime() + 7 * 24 * 60 * 60 * 1_000),
        },
      });

      return transaction.marketplaceOffer.findUniqueOrThrow({
        where: {
          id: offer.id,
        },
        include: offerInclude,
      });
    });

    if (updated.transaction) {
      await this.attachTransactionConversationSafely(
        userId,
        updated.buyerId,
        updated.sellerId,
        updated.listingId,
        updated.transaction.id,
        updated.transaction.agreedPricePence,
      );
    }

    const acceptedRecipientId = userId === updated.buyerId ? updated.sellerId : updated.buyerId;

    await this.createMarketplaceNotification(
      acceptedRecipientId,
      userId,
      NotificationType.MARKETPLACE_OFFER_ACCEPTED,
      `marketplace-offer-accepted:${updated.id}`,
    );

    return this.mapOffer(await this.requireOffer(updated.id));
  }

  async declineOffer(userId: string, offerId: string): Promise<MarketplaceOfferResponse> {
    const offer = await this.requireParticipatingOffer(userId, offerId);

    this.requireActiveOffer(offer);

    const latestActorId = offer.history.at(-1)?.actorId ?? null;

    if (latestActorId === userId) {
      throw new ConflictException('You cannot decline your own offer action.');
    }

    const declinedAt = new Date();

    const updated = await this.database.$transaction(async (transaction) => {
      await transaction.marketplaceOffer.update({
        where: {
          id: offer.id,
        },
        data: {
          status: MarketplaceOfferStatus.DECLINED,
          declinedAt,
        },
      });

      await transaction.marketplaceOfferHistory.create({
        data: {
          offerId: offer.id,
          actorId: userId,
          fromStatus: offer.status,
          toStatus: MarketplaceOfferStatus.DECLINED,
          amountPence: offer.amountPence,
          note: 'Offer declined.',
        },
      });

      return transaction.marketplaceOffer.findUniqueOrThrow({
        where: {
          id: offer.id,
        },
        include: offerInclude,
      });
    });

    const declinedRecipientId = userId === updated.buyerId ? updated.sellerId : updated.buyerId;

    await this.createMarketplaceNotification(
      declinedRecipientId,
      userId,
      NotificationType.MARKETPLACE_OFFER_DECLINED,
      `marketplace-offer-declined:${updated.id}`,
    );

    return this.mapOffer(updated);
  }

  async withdrawOffer(buyerId: string, offerId: string): Promise<MarketplaceOfferResponse> {
    const offer = await this.requireOffer(offerId);

    if (offer.buyerId !== buyerId) {
      throw new ForbiddenException('Only the buyer may withdraw this offer.');
    }

    this.requireActiveOffer(offer);

    const withdrawnAt = new Date();

    const updated = await this.database.$transaction(async (transaction) => {
      await transaction.marketplaceOffer.update({
        where: {
          id: offer.id,
        },
        data: {
          status: MarketplaceOfferStatus.WITHDRAWN,
          withdrawnAt,
        },
      });

      await transaction.marketplaceOfferHistory.create({
        data: {
          offerId: offer.id,
          actorId: buyerId,
          fromStatus: offer.status,
          toStatus: MarketplaceOfferStatus.WITHDRAWN,
          amountPence: offer.amountPence,
          note: 'Offer withdrawn.',
        },
      });

      return transaction.marketplaceOffer.findUniqueOrThrow({
        where: {
          id: offer.id,
        },
        include: offerInclude,
      });
    });

    return this.mapOffer(updated);
  }

  async listMine(
    userId: string,
    query: MarketplaceOfferQueryDto,
  ): Promise<MarketplaceOfferListResponse> {
    await this.expireStaleMarketplaceState();

    const offers = await this.database.marketplaceOffer.findMany({
      where: {
        OR: [
          {
            buyerId: userId,
          },
          {
            sellerId: userId,
          },
        ],
        ...(query.status
          ? {
              status: query.status,
            }
          : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: offerInclude,
    });

    const sent = offers.filter((offer) => {
      const creatorId = offer.history.at(0)?.actorId ?? null;

      return creatorId === userId;
    });

    return {
      items: sent.slice(0, query.limit ?? 50).map((offer) => this.mapOffer(offer)),
    };
  }

  async listReceived(
    userId: string,
    query: MarketplaceOfferQueryDto,
  ): Promise<MarketplaceOfferListResponse> {
    await this.expireStaleMarketplaceState();

    const offers = await this.database.marketplaceOffer.findMany({
      where: {
        OR: [
          {
            buyerId: userId,
          },
          {
            sellerId: userId,
          },
        ],
        ...(query.status
          ? {
              status: query.status,
            }
          : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: offerInclude,
    });

    const received = offers.filter((offer) => {
      const creatorId = offer.history.at(0)?.actorId ?? null;

      return creatorId !== null && creatorId !== userId;
    });

    return {
      items: received.slice(0, query.limit ?? 50).map((offer) => this.mapOffer(offer)),
    };
  }

  async listListingOffers(
    sellerId: string,
    listingId: string,
  ): Promise<MarketplaceOfferListResponse> {
    const listing = await this.database.marketplaceListing.findFirst({
      where: {
        id: listingId,
        sellerId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!listing) {
      throw new NotFoundException('Marketplace listing not found.');
    }

    const offers = await this.database.marketplaceOffer.findMany({
      where: {
        listingId,
      },
      include: offerInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      items: offers.map((offer) => this.mapOffer(offer)),
    };
  }

  async getOffer(userId: string, offerId: string): Promise<MarketplaceOfferResponse> {
    await this.expireStaleMarketplaceState();
    return this.mapOffer(await this.requireParticipatingOffer(userId, offerId));
  }

  async processExpiredState(): Promise<{
    processed: boolean;
  }> {
    await this.expireStaleMarketplaceState();

    return {
      processed: true,
    };
  }

  async listTransactions(userId: string): Promise<MarketplaceTransactionResponse[]> {
    await this.expireStaleMarketplaceState();
    return this.database.marketplaceTransaction.findMany({
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
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateTransactionStatus(
    userId: string,
    transactionId: string,
    status: MarketplaceTransactionStatus,
  ): Promise<MarketplaceTransactionResponse> {
    const transaction = await this.database.marketplaceTransaction.findFirst({
      where: {
        id: transactionId,
        OR: [
          {
            buyerId: userId,
          },
          {
            sellerId: userId,
          },
        ],
      },
    });

    if (!transaction) {
      throw new NotFoundException('Marketplace transaction not found.');
    }

    if (
      transaction.status === MarketplaceTransactionStatus.COMPLETED ||
      transaction.status === MarketplaceTransactionStatus.CANCELLED
    ) {
      throw new ConflictException('This transaction can no longer be updated.');
    }

    if (
      status === MarketplaceTransactionStatus.COMPLETED ||
      status === MarketplaceTransactionStatus.CANCELLED ||
      status === MarketplaceTransactionStatus.RESERVED
    ) {
      throw new BadRequestException('Use the dedicated completion or cancellation action.');
    }

    if (
      status === MarketplaceTransactionStatus.COLLECTION_PENDING &&
      userId !== transaction.sellerId
    ) {
      throw new ForbiddenException('Only the seller may mark collection as pending.');
    }

    if (
      status === MarketplaceTransactionStatus.DELIVERY_PENDING &&
      userId !== transaction.sellerId
    ) {
      throw new ForbiddenException('Only the seller may mark delivery as pending.');
    }

    const updated = await this.database.marketplaceTransaction.update({
      where: {
        id: transaction.id,
      },
      data: {
        status,
      },
    });

    await this.createMarketplaceNotification(
      userId === transaction.buyerId ? transaction.sellerId : transaction.buyerId,
      userId,
      NotificationType.MARKETPLACE_TRANSACTION,
      `marketplace-transaction-status:${transaction.id}:${status}`,
    );

    return updated;
  }

  async getTransaction(
    userId: string,
    transactionId: string,
  ): Promise<MarketplaceTransactionResponse> {
    await this.expireStaleMarketplaceState();
    const transaction = await this.database.marketplaceTransaction.findFirst({
      where: {
        id: transactionId,
        OR: [
          {
            buyerId: userId,
          },
          {
            sellerId: userId,
          },
        ],
      },
    });

    if (!transaction) {
      throw new NotFoundException('Marketplace transaction not found.');
    }

    return transaction;
  }

  async completeTransaction(
    sellerId: string,
    transactionId: string,
  ): Promise<MarketplaceTransactionResponse> {
    const transaction = await this.database.marketplaceTransaction.findFirst({
      where: {
        id: transactionId,
        sellerId,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Marketplace transaction not found.');
    }

    if (transaction.status === MarketplaceTransactionStatus.COMPLETED) {
      return transaction;
    }

    if (transaction.status === MarketplaceTransactionStatus.CANCELLED) {
      throw new ConflictException('A cancelled transaction cannot be completed.');
    }

    const completedAt = new Date();

    return this.database.$transaction(async (databaseTransaction) => {
      const updated = await databaseTransaction.marketplaceTransaction.update({
        where: {
          id: transaction.id,
        },
        data: {
          status: MarketplaceTransactionStatus.COMPLETED,
          completedAt,
        },
      });

      await databaseTransaction.marketplaceListing.update({
        where: {
          id: transaction.listingId,
        },
        data: {
          status: MarketplaceListingStatus.SOLD,
          soldAt: completedAt,
        },
      });

      return updated;
    });
  }

  async cancelTransaction(
    userId: string,
    transactionId: string,
  ): Promise<MarketplaceTransactionResponse> {
    const transaction = await this.database.marketplaceTransaction.findFirst({
      where: {
        id: transactionId,
        OR: [
          {
            buyerId: userId,
          },
          {
            sellerId: userId,
          },
        ],
      },
    });

    if (!transaction) {
      throw new NotFoundException('Marketplace transaction not found.');
    }

    if (transaction.status === MarketplaceTransactionStatus.COMPLETED) {
      throw new ConflictException('A completed transaction cannot be cancelled.');
    }

    if (transaction.status === MarketplaceTransactionStatus.CANCELLED) {
      return transaction;
    }

    const cancelledAt = new Date();

    return this.database.$transaction(async (databaseTransaction) => {
      const updated = await databaseTransaction.marketplaceTransaction.update({
        where: {
          id: transaction.id,
        },
        data: {
          status: MarketplaceTransactionStatus.CANCELLED,
          cancelledAt,
        },
      });

      if (transaction.acceptedOfferId) {
        await databaseTransaction.marketplaceOffer.update({
          where: {
            id: transaction.acceptedOfferId,
          },
          data: {
            status: MarketplaceOfferStatus.CANCELLED,
            cancelledAt,
          },
        });

        await databaseTransaction.marketplaceOfferHistory.create({
          data: {
            offerId: transaction.acceptedOfferId,
            actorId: userId,
            fromStatus: MarketplaceOfferStatus.ACCEPTED,
            toStatus: MarketplaceOfferStatus.CANCELLED,
            note: 'Transaction cancelled.',
          },
        });
      }

      await databaseTransaction.marketplaceListing.update({
        where: {
          id: transaction.listingId,
        },
        data: {
          status: MarketplaceListingStatus.PUBLISHED,
          reservedAt: null,
        },
      });

      return updated;
    });
  }

  private async expireStaleMarketplaceState(): Promise<void> {
    const now = new Date();

    await this.database.$transaction(async (transaction) => {
      const expiredOffers = await transaction.marketplaceOffer.findMany({
        where: {
          status: {
            in: ACTIVE_OFFER_STATUSES,
          },
          expiresAt: {
            lte: now,
          },
        },
        select: {
          id: true,
          buyerId: true,
          status: true,
          amountPence: true,
        },
      });

      for (const offer of expiredOffers) {
        await transaction.marketplaceOffer.update({
          where: {
            id: offer.id,
          },
          data: {
            status: MarketplaceOfferStatus.EXPIRED,
          },
        });

        await transaction.marketplaceOfferHistory.create({
          data: {
            offerId: offer.id,
            actorId: offer.buyerId,
            fromStatus: offer.status,
            toStatus: MarketplaceOfferStatus.EXPIRED,
            amountPence: offer.amountPence,
            note: 'Offer expired automatically.',
          },
        });
      }

      const expiredTransactions = await transaction.marketplaceTransaction.findMany({
        where: {
          status: {
            notIn: [MarketplaceTransactionStatus.COMPLETED, MarketplaceTransactionStatus.CANCELLED],
          },
          expiresAt: {
            lte: now,
          },
        },
        select: {
          id: true,
          listingId: true,
          acceptedOfferId: true,
          buyerId: true,
        },
      });

      for (const marketplaceTransaction of expiredTransactions) {
        await transaction.marketplaceTransaction.update({
          where: {
            id: marketplaceTransaction.id,
          },
          data: {
            status: MarketplaceTransactionStatus.CANCELLED,
            cancelledAt: now,
          },
        });

        if (marketplaceTransaction.acceptedOfferId) {
          const acceptedOffer = await transaction.marketplaceOffer.findUnique({
            where: {
              id: marketplaceTransaction.acceptedOfferId,
            },
            select: {
              status: true,
              amountPence: true,
            },
          });

          if (acceptedOffer && acceptedOffer.status !== MarketplaceOfferStatus.CANCELLED) {
            await transaction.marketplaceOffer.update({
              where: {
                id: marketplaceTransaction.acceptedOfferId,
              },
              data: {
                status: MarketplaceOfferStatus.CANCELLED,
                cancelledAt: now,
              },
            });

            await transaction.marketplaceOfferHistory.create({
              data: {
                offerId: marketplaceTransaction.acceptedOfferId,
                actorId: marketplaceTransaction.buyerId,
                fromStatus: acceptedOffer.status,
                toStatus: MarketplaceOfferStatus.CANCELLED,
                amountPence: acceptedOffer.amountPence,
                note: 'Reservation expired automatically.',
              },
            });
          }
        }

        await transaction.marketplaceListing.updateMany({
          where: {
            id: marketplaceTransaction.listingId,
            status: MarketplaceListingStatus.RESERVED,
            deletedAt: null,
          },
          data: {
            status: MarketplaceListingStatus.PUBLISHED,
            reservedAt: null,
          },
        });
      }
    });
  }

  private async attachTransactionConversationSafely(
    actorId: string,
    buyerId: string,
    sellerId: string,
    listingId: string,
    transactionId: string,
    agreedPricePence: number,
  ): Promise<void> {
    try {
      const conversationId = await this.createTransactionConversation(
        actorId,
        buyerId,
        sellerId,
        listingId,
        transactionId,
        agreedPricePence,
      );

      await this.database.marketplaceTransaction.update({
        where: {
          id: transactionId,
        },
        data: {
          conversationId,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown marketplace conversation error.';

      this.logger.warn(
        `Marketplace transaction ${transactionId} completed without a conversation: ${message}`,
      );
    }
  }

  private async createTransactionConversation(
    actorId: string,
    buyerId: string,
    sellerId: string,
    listingId: string,
    transactionId: string,
    agreedPricePence: number,
  ): Promise<string> {
    const otherUserId = actorId === buyerId ? sellerId : buyerId;

    const conversation = await this.messages.createConversation(actorId, {
      type: ConversationType.DIRECT,
      memberIds: [otherUserId],
      title: 'Marketplace Transaction',
    });

    await this.messages.sendMessage(actorId, conversation.id, {
      type: MessageType.SYSTEM,
      content: `Offer accepted for £${(agreedPricePence / 100).toFixed(
        2,
      )}. The listing is now reserved.`,
      clientNonce: `marketplace-transaction-${transactionId}`,
      metadata: {
        kind: 'MARKETPLACE_TRANSACTION',
        listingId,
        transactionId,
        agreedPricePence,
      },
    });

    return conversation.id;
  }

  private async createMarketplaceNotification(
    recipientId: string,
    actorId: string,
    type: NotificationType,
    idempotencyKey: string,
  ): Promise<void> {
    if (recipientId === actorId) {
      return;
    }

    await this.database.notification.upsert({
      where: {
        idempotencyKey,
      },
      create: {
        recipientId,
        actorId,
        type,
        idempotencyKey,
      },
      update: {
        dismissedAt: null,
        readAt: null,
      },
    });
  }

  private async requireOffer(offerId: string): Promise<OfferWithRelations> {
    const offer = await this.database.marketplaceOffer.findUnique({
      where: {
        id: offerId,
      },
      include: offerInclude,
    });

    if (!offer) {
      throw new NotFoundException('Marketplace offer not found.');
    }

    return offer;
  }

  private async requireParticipatingOffer(
    userId: string,
    offerId: string,
  ): Promise<OfferWithRelations> {
    const offer = await this.requireOffer(offerId);

    if (offer.buyerId !== userId && offer.sellerId !== userId) {
      throw new ForbiddenException('You do not have access to this offer.');
    }

    return offer;
  }

  private requireActiveOffer(offer: OfferWithRelations): void {
    if (!ACTIVE_OFFER_STATUSES.includes(offer.status)) {
      throw new ConflictException('This offer is no longer active.');
    }

    if (offer.expiresAt && offer.expiresAt.getTime() <= Date.now()) {
      throw new ConflictException('This offer has expired.');
    }
  }

  private async requireNoBlockRelationship(userId: string, otherUserId: string): Promise<void> {
    const block = await this.database.userBlock.findFirst({
      where: {
        OR: [
          {
            blockerId: userId,
            blockedId: otherUserId,
          },
          {
            blockerId: otherUserId,
            blockedId: userId,
          },
        ],
      },
      select: {
        id: true,
      },
    });

    if (block) {
      throw new ForbiddenException('Offers are unavailable between these users.');
    }
  }

  private resolveExpiry(expiresInDays?: number): Date {
    const days = expiresInDays ?? 7;

    return new Date(Date.now() + days * 24 * 60 * 60 * 1_000);
  }

  private mapOffer(offer: OfferWithRelations): MarketplaceOfferResponse {
    return {
      id: offer.id,
      listingId: offer.listingId,
      buyerId: offer.buyerId,
      sellerId: offer.sellerId,
      parentOfferId: offer.parentOfferId,
      status: offer.status,
      amountPence: offer.amountPence,
      message: offer.message,
      expiresAt: offer.expiresAt,
      acceptedAt: offer.acceptedAt,
      declinedAt: offer.declinedAt,
      withdrawnAt: offer.withdrawnAt,
      cancelledAt: offer.cancelledAt,
      createdAt: offer.createdAt,
      updatedAt: offer.updatedAt,
      buyer: {
        id: offer.buyer.id,
        displayName: offer.buyer.displayName,
        username: offer.buyer.profile?.username ?? null,
        avatarUrl: offer.buyer.profile?.avatarUrl ?? null,
      },
      seller: {
        id: offer.seller.id,
        displayName: offer.seller.displayName,
        username: offer.seller.profile?.username ?? null,
        avatarUrl: offer.seller.profile?.avatarUrl ?? null,
      },
      listing: {
        id: offer.listing.id,
        title: offer.listing.title,
        pricePence: offer.listing.pricePence,
        isFree: offer.listing.isFree,
        status: offer.listing.status,
        imageUrl: offer.listing.media[0]?.media.publicUrl ?? null,
      },
      history: offer.history.map((history) => ({
        id: history.id,
        actorId: history.actorId,
        fromStatus: history.fromStatus,
        toStatus: history.toStatus,
        amountPence: history.amountPence,
        note: history.note,
        createdAt: history.createdAt,
      })),
      transaction: offer.transaction,
    };
  }
}
