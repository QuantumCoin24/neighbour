import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes, randomInt } from 'node:crypto';

import { DatabaseService } from '../../../database/database.service';
import {
  MarketplaceFulfilmentEventType,
  MarketplaceFulfilmentMethod,
  MarketplaceFulfilmentStatus,
  MarketplaceListingStatus,
  MarketplaceTransactionStatus,
  MarketplaceVerificationStatus,
  MarketplaceVerificationType,
  NotificationType,
  Prisma,
} from '../../../generated/prisma/client';

import type { CreateCollectionDto } from '../dto/create-collection.dto';
import type { CreateDeliveryDto } from '../dto/create-delivery.dto';
import type { CreateFulfilmentDto } from '../dto/create-fulfilment.dto';
import type { UploadProofDto } from '../dto/upload-proof.dto';
import type { MarketplaceFulfilmentResponse } from '../interfaces/fulfilment-response.interface';

const fulfilmentInclude = {
  transaction: true,
  collection: true,
  delivery: true,
  events: {
    orderBy: {
      createdAt: 'asc',
    },
  },
  proofs: {
    include: {
      media: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  },
} satisfies Prisma.MarketplaceFulfilmentInclude;

type FulfilmentWithRelations = Prisma.MarketplaceFulfilmentGetPayload<{
  include: typeof fulfilmentInclude;
}>;

@Injectable()
export class FulfilmentService {
  constructor(private readonly database: DatabaseService) {}

  getHealth() {
    return {
      service: 'FulfilmentOS',
      status: 'READY' as const,
    };
  }

  async create(
    userId: string,
    transactionId: string,
    dto: CreateFulfilmentDto,
  ): Promise<MarketplaceFulfilmentResponse> {
    const transaction = await this.requireTransactionParticipant(userId, transactionId);

    if (
      transaction.status === MarketplaceTransactionStatus.COMPLETED ||
      transaction.status === MarketplaceTransactionStatus.CANCELLED
    ) {
      throw new ConflictException('Fulfilment cannot be created for this transaction.');
    }

    const existing = await this.database.marketplaceFulfilment.findUnique({
      where: {
        transactionId,
      },
      include: fulfilmentInclude,
    });

    if (existing) {
      return this.map(existing);
    }

    const fulfilment = await this.database.$transaction(async (tx) => {
      const created = await tx.marketplaceFulfilment.create({
        data: {
          transactionId,
          method: dto.method,
          status: MarketplaceFulfilmentStatus.PENDING,
          expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1_000),
        },
      });

      await tx.marketplaceFulfilmentEvent.createMany({
        data: [
          {
            fulfilmentId: created.id,
            actorId: userId,
            type: MarketplaceFulfilmentEventType.CREATED,
            note: 'Fulfilment workflow created.',
          },
          {
            fulfilmentId: created.id,
            actorId: userId,
            type: MarketplaceFulfilmentEventType.METHOD_SELECTED,
            metadata: {
              method: dto.method,
            },
          },
        ],
      });

      return tx.marketplaceFulfilment.findUniqueOrThrow({
        where: {
          id: created.id,
        },
        include: fulfilmentInclude,
      });
    });

    await this.notifyOtherParticipant(fulfilment, userId, 'created');

    return this.map(fulfilment);
  }

  async findOne(userId: string, fulfilmentId: string): Promise<MarketplaceFulfilmentResponse> {
    return this.map(await this.requireParticipant(userId, fulfilmentId));
  }

  async findByTransaction(
    userId: string,
    transactionId: string,
  ): Promise<MarketplaceFulfilmentResponse> {
    await this.requireTransactionParticipant(userId, transactionId);

    const fulfilment = await this.database.marketplaceFulfilment.findUnique({
      where: {
        transactionId,
      },
      include: fulfilmentInclude,
    });

    if (!fulfilment) {
      throw new NotFoundException('Marketplace fulfilment not found.');
    }

    return this.map(fulfilment);
  }

  async createCollection(
    userId: string,
    fulfilmentId: string,
    dto: CreateCollectionDto,
  ): Promise<MarketplaceFulfilmentResponse> {
    const fulfilment = await this.requireParticipant(userId, fulfilmentId);

    if (fulfilment.method !== MarketplaceFulfilmentMethod.COLLECTION) {
      throw new BadRequestException('This fulfilment is not using collection.');
    }

    if (userId !== fulfilment.transaction.sellerId) {
      throw new ForbiddenException('Only the seller may schedule collection.');
    }

    const scheduledFor = new Date(dto.scheduledFor);

    if (Number.isNaN(scheduledFor.getTime()) || scheduledFor.getTime() <= Date.now()) {
      throw new BadRequestException('Collection must be scheduled in the future.');
    }

    await this.database.$transaction(async (tx) => {
      await tx.marketplaceCollection.upsert({
        where: {
          fulfilmentId,
        },
        create: {
          fulfilmentId,
          addressLine1: dto.addressLine1.trim(),
          addressLine2: dto.addressLine2?.trim() || null,
          city: dto.city.trim(),
          postcode: dto.postcode.trim().toUpperCase(),
          instructions: dto.instructions?.trim() || null,
          scheduledFor,
        },
        update: {
          addressLine1: dto.addressLine1.trim(),
          addressLine2: dto.addressLine2?.trim() || null,
          city: dto.city.trim(),
          postcode: dto.postcode.trim().toUpperCase(),
          instructions: dto.instructions?.trim() || null,
          scheduledFor,
        },
      });

      await tx.marketplaceFulfilment.update({
        where: {
          id: fulfilmentId,
        },
        data: {
          status: MarketplaceFulfilmentStatus.SCHEDULED,
          scheduledAt: scheduledFor,
        },
      });

      await tx.marketplaceFulfilmentEvent.create({
        data: {
          fulfilmentId,
          actorId: userId,
          type: MarketplaceFulfilmentEventType.COLLECTION_SCHEDULED,
          metadata: {
            scheduledFor: scheduledFor.toISOString(),
          },
        },
      });
    });

    return this.findOne(userId, fulfilmentId);
  }

  async createDelivery(
    userId: string,
    fulfilmentId: string,
    dto: CreateDeliveryDto,
  ): Promise<MarketplaceFulfilmentResponse> {
    const fulfilment = await this.requireParticipant(userId, fulfilmentId);

    if (fulfilment.method === MarketplaceFulfilmentMethod.COLLECTION) {
      throw new BadRequestException('Collection fulfilment cannot use delivery details.');
    }

    if (userId !== fulfilment.transaction.sellerId) {
      throw new ForbiddenException('Only the seller may configure delivery.');
    }

    const scheduledFor = dto.scheduledFor ? new Date(dto.scheduledFor) : null;

    const normalisedAddressLine1 = dto.addressLine1.trim();
    const normalisedAddressLine2 = dto.addressLine2?.trim() || null;
    const normalisedCity = dto.city.trim();
    const normalisedPostcode = dto.postcode.trim().toUpperCase();
    const normalisedCourier = dto.courier?.trim() || null;
    const normalisedTrackingNumber = dto.trackingNumber?.trim() || null;
    const normalisedInstructions = dto.instructions?.trim() || null;

    const existingDelivery = fulfilment.delivery;

    const unchanged =
      existingDelivery !== null &&
      existingDelivery.addressLine1 === normalisedAddressLine1 &&
      existingDelivery.addressLine2 === normalisedAddressLine2 &&
      existingDelivery.city === normalisedCity &&
      existingDelivery.postcode === normalisedPostcode &&
      existingDelivery.courier === normalisedCourier &&
      existingDelivery.trackingNumber === normalisedTrackingNumber &&
      existingDelivery.instructions === normalisedInstructions &&
      (existingDelivery.scheduledFor?.getTime() ?? null) === (scheduledFor?.getTime() ?? null) &&
      fulfilment.status ===
        (scheduledFor
          ? MarketplaceFulfilmentStatus.SCHEDULED
          : MarketplaceFulfilmentStatus.PENDING) &&
      (fulfilment.scheduledAt?.getTime() ?? null) === (scheduledFor?.getTime() ?? null);

    if (unchanged) {
      return this.map(fulfilment);
    }

    await this.database.$transaction(async (tx) => {
      await tx.marketplaceDelivery.upsert({
        where: {
          fulfilmentId,
        },
        create: {
          fulfilmentId,
          addressLine1: normalisedAddressLine1,
          addressLine2: normalisedAddressLine2,
          city: normalisedCity,
          postcode: normalisedPostcode,
          courier: normalisedCourier,
          trackingNumber: normalisedTrackingNumber,
          instructions: normalisedInstructions,
          scheduledFor,
        },
        update: {
          addressLine1: normalisedAddressLine1,
          addressLine2: normalisedAddressLine2,
          city: normalisedCity,
          postcode: normalisedPostcode,
          courier: normalisedCourier,
          trackingNumber: normalisedTrackingNumber,
          instructions: normalisedInstructions,
          scheduledFor,
        },
      });

      await tx.marketplaceFulfilment.update({
        where: {
          id: fulfilmentId,
        },
        data: {
          status: scheduledFor
            ? MarketplaceFulfilmentStatus.SCHEDULED
            : MarketplaceFulfilmentStatus.PENDING,
          scheduledAt: scheduledFor,
        },
      });

      if (scheduledFor) {
        await tx.marketplaceFulfilmentEvent.create({
          data: {
            fulfilmentId,
            actorId: userId,
            type: MarketplaceFulfilmentEventType.DELIVERY_SCHEDULED,
            metadata: {
              scheduledFor: scheduledFor.toISOString(),
            },
          },
        });
      }
    });

    return this.findOne(userId, fulfilmentId);
  }

  async generatePin(userId: string, fulfilmentId: string) {
    const fulfilment = await this.requireParticipant(userId, fulfilmentId);

    if (userId !== fulfilment.transaction.sellerId) {
      throw new ForbiddenException('Only the seller may generate a handover PIN.');
    }

    const pin = String(randomInt(100_000, 1_000_000));

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1_000);

    await this.database.$transaction(async (tx) => {
      await tx.marketplaceFulfilmentVerification.updateMany({
        where: {
          fulfilmentId,
          type: MarketplaceVerificationType.PIN,
          status: MarketplaceVerificationStatus.PENDING,
        },
        data: {
          status: MarketplaceVerificationStatus.EXPIRED,
        },
      });

      await tx.marketplaceFulfilmentVerification.create({
        data: {
          fulfilmentId,
          type: MarketplaceVerificationType.PIN,
          status: MarketplaceVerificationStatus.PENDING,
          tokenHash: this.hash(pin),
          expiresAt,
        },
      });

      await tx.marketplaceFulfilmentEvent.create({
        data: {
          fulfilmentId,
          actorId: userId,
          type: MarketplaceFulfilmentEventType.PIN_GENERATED,
        },
      });
    });

    return {
      pin,
      expiresAt,
    };
  }

  async generateQr(userId: string, fulfilmentId: string) {
    const fulfilment = await this.requireParticipant(userId, fulfilmentId);

    if (userId !== fulfilment.transaction.sellerId) {
      throw new ForbiddenException('Only the seller may generate a QR handover token.');
    }

    const token = randomBytes(32).toString('hex');

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1_000);

    await this.database.$transaction(async (tx) => {
      await tx.marketplaceFulfilmentVerification.updateMany({
        where: {
          fulfilmentId,
          type: MarketplaceVerificationType.QR,
          status: MarketplaceVerificationStatus.PENDING,
        },
        data: {
          status: MarketplaceVerificationStatus.EXPIRED,
        },
      });

      await tx.marketplaceFulfilmentVerification.create({
        data: {
          fulfilmentId,
          type: MarketplaceVerificationType.QR,
          status: MarketplaceVerificationStatus.PENDING,
          tokenHash: this.hash(token),
          expiresAt,
        },
      });

      await tx.marketplaceFulfilmentEvent.create({
        data: {
          fulfilmentId,
          actorId: userId,
          type: MarketplaceFulfilmentEventType.QR_GENERATED,
        },
      });
    });

    return {
      token,
      expiresAt,
    };
  }

  async verifyPin(
    userId: string,
    fulfilmentId: string,
    pin: string,
  ): Promise<MarketplaceFulfilmentResponse> {
    return this.verifyHandover(userId, fulfilmentId, MarketplaceVerificationType.PIN, pin);
  }

  async verifyQr(
    userId: string,
    fulfilmentId: string,
    token: string,
  ): Promise<MarketplaceFulfilmentResponse> {
    return this.verifyHandover(userId, fulfilmentId, MarketplaceVerificationType.QR, token);
  }

  async addProof(
    userId: string,
    fulfilmentId: string,
    dto: UploadProofDto,
  ): Promise<MarketplaceFulfilmentResponse> {
    await this.requireParticipant(userId, fulfilmentId);

    const media = await this.database.mediaAsset.findFirst({
      where: {
        id: dto.mediaId,
        ownerId: userId,
        status: 'READY',
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!media) {
      throw new ForbiddenException('The selected proof media is unavailable.');
    }

    await this.database.$transaction(async (tx) => {
      await tx.marketplaceFulfilmentProof.create({
        data: {
          fulfilmentId,
          uploadedById: userId,
          mediaId: dto.mediaId,
          type: dto.type,
          note: dto.note?.trim() || null,
        },
      });

      await tx.marketplaceFulfilmentEvent.create({
        data: {
          fulfilmentId,
          actorId: userId,
          type: MarketplaceFulfilmentEventType.PROOF_ADDED,
        },
      });
    });

    return this.findOne(userId, fulfilmentId);
  }

  async confirm(userId: string, fulfilmentId: string): Promise<MarketplaceFulfilmentResponse> {
    const fulfilment = await this.requireParticipant(userId, fulfilmentId);

    const isBuyer = userId === fulfilment.transaction.buyerId;

    const isSeller = userId === fulfilment.transaction.sellerId;

    const alreadyConfirmed = isBuyer
      ? fulfilment.buyerConfirmedAt !== null
      : fulfilment.sellerConfirmedAt !== null;

    if (alreadyConfirmed) {
      return this.findOne(userId, fulfilmentId);
    }

    const now = new Date();

    await this.database.$transaction(async (tx) => {
      await tx.marketplaceFulfilment.update({
        where: {
          id: fulfilmentId,
        },
        data: {
          ...(isBuyer
            ? {
                buyerConfirmedAt: now,
              }
            : {}),
          ...(isSeller
            ? {
                sellerConfirmedAt: now,
              }
            : {}),
          status: MarketplaceFulfilmentStatus.AWAITING_CONFIRMATION,
        },
      });

      await tx.marketplaceFulfilmentEvent.create({
        data: {
          fulfilmentId,
          actorId: userId,
          type: isBuyer
            ? MarketplaceFulfilmentEventType.BUYER_CONFIRMED
            : MarketplaceFulfilmentEventType.SELLER_CONFIRMED,
        },
      });

      const refreshed = await tx.marketplaceFulfilment.findUniqueOrThrow({
        where: {
          id: fulfilmentId,
        },
        include: {
          transaction: true,
        },
      });

      if (refreshed.buyerConfirmedAt && refreshed.sellerConfirmedAt) {
        await tx.marketplaceFulfilment.update({
          where: {
            id: fulfilmentId,
          },
          data: {
            status: MarketplaceFulfilmentStatus.COMPLETED,
            completedAt: now,
          },
        });

        await tx.marketplaceTransaction.update({
          where: {
            id: fulfilment.transactionId,
          },
          data: {
            status: MarketplaceTransactionStatus.COMPLETED,
            completedAt: now,
          },
        });

        await tx.marketplaceListing.update({
          where: {
            id: fulfilment.transaction.listingId,
          },
          data: {
            status: MarketplaceListingStatus.SOLD,
            soldAt: now,
          },
        });

        await tx.marketplaceFulfilmentEvent.create({
          data: {
            fulfilmentId,
            actorId: userId,
            type: MarketplaceFulfilmentEventType.COMPLETED,
          },
        });
      }
    });

    return this.findOne(userId, fulfilmentId);
  }

  private async verifyHandover(
    userId: string,
    fulfilmentId: string,
    type: MarketplaceVerificationType,
    token: string,
  ): Promise<MarketplaceFulfilmentResponse> {
    const fulfilment = await this.requireParticipant(userId, fulfilmentId);

    if (userId !== fulfilment.transaction.buyerId) {
      throw new ForbiddenException('Only the buyer may verify the handover.');
    }

    const verification = await this.database.marketplaceFulfilmentVerification.findFirst({
      where: {
        fulfilmentId,
        type,
        status: MarketplaceVerificationStatus.PENDING,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!verification || verification.expiresAt.getTime() <= Date.now()) {
      throw new NotFoundException('Active verification not found.');
    }

    if (verification.tokenHash !== this.hash(token)) {
      await this.database.marketplaceFulfilmentVerification.update({
        where: {
          id: verification.id,
        },
        data: {
          attemptCount: {
            increment: 1,
          },
        },
      });

      throw new BadRequestException('Verification value is invalid.');
    }

    const now = new Date();

    await this.database.$transaction(async (tx) => {
      await tx.marketplaceFulfilmentVerification.update({
        where: {
          id: verification.id,
        },
        data: {
          status: MarketplaceVerificationStatus.VERIFIED,
          verifiedAt: now,
        },
      });

      await tx.marketplaceFulfilment.update({
        where: {
          id: fulfilmentId,
        },
        data: {
          status: MarketplaceFulfilmentStatus.IN_PROGRESS,
          readyAt: fulfilment.readyAt ?? now,
        },
      });

      await tx.marketplaceCollection.updateMany({
        where: {
          fulfilmentId,
        },
        data: {
          handoverVerifiedAt: now,
        },
      });

      await tx.marketplaceFulfilmentEvent.create({
        data: {
          fulfilmentId,
          actorId: userId,
          type: MarketplaceFulfilmentEventType.HANDOVER_VERIFIED,
          metadata: {
            method: type,
          },
        },
      });
    });

    return this.findOne(userId, fulfilmentId);
  }

  private async requireTransactionParticipant(userId: string, transactionId: string) {
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

  private async requireParticipant(
    userId: string,
    fulfilmentId: string,
  ): Promise<FulfilmentWithRelations> {
    const fulfilment = await this.database.marketplaceFulfilment.findFirst({
      where: {
        id: fulfilmentId,
        transaction: {
          OR: [
            {
              buyerId: userId,
            },
            {
              sellerId: userId,
            },
          ],
        },
      },
      include: fulfilmentInclude,
    });

    if (!fulfilment) {
      throw new NotFoundException('Marketplace fulfilment not found.');
    }

    return fulfilment;
  }

  private async notifyOtherParticipant(
    fulfilment: FulfilmentWithRelations,
    actorId: string,
    event: string,
  ): Promise<void> {
    const recipientId =
      actorId === fulfilment.transaction.buyerId
        ? fulfilment.transaction.sellerId
        : fulfilment.transaction.buyerId;

    await this.database.notification.upsert({
      where: {
        idempotencyKey: `fulfilment:${fulfilment.id}:${event}:${recipientId}`,
      },
      create: {
        recipientId,
        actorId,
        type: NotificationType.MARKETPLACE_TRANSACTION,
        idempotencyKey: `fulfilment:${fulfilment.id}:${event}:${recipientId}`,
      },
      update: {
        readAt: null,
        dismissedAt: null,
      },
    });
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private map(fulfilment: FulfilmentWithRelations): MarketplaceFulfilmentResponse {
    return {
      id: fulfilment.id,
      transactionId: fulfilment.transactionId,
      method: fulfilment.method,
      status: fulfilment.status,
      buyerConfirmedAt: fulfilment.buyerConfirmedAt,
      sellerConfirmedAt: fulfilment.sellerConfirmedAt,
      scheduledAt: fulfilment.scheduledAt,
      readyAt: fulfilment.readyAt,
      dispatchedAt: fulfilment.dispatchedAt,
      deliveredAt: fulfilment.deliveredAt,
      completedAt: fulfilment.completedAt,
      cancelledAt: fulfilment.cancelledAt,
      expiresAt: fulfilment.expiresAt,
      createdAt: fulfilment.createdAt,
      updatedAt: fulfilment.updatedAt,
      collection: fulfilment.collection,
      delivery: fulfilment.delivery,
      timeline: fulfilment.events.map((event) => ({
        id: event.id,
        actorId: event.actorId,
        type: event.type,
        note: event.note,
        metadata:
          event.metadata && typeof event.metadata === 'object' && !Array.isArray(event.metadata)
            ? (event.metadata as Record<string, unknown>)
            : null,
        createdAt: event.createdAt,
      })),
      proofs: fulfilment.proofs.map((proof) => ({
        id: proof.id,
        uploadedById: proof.uploadedById,
        mediaId: proof.mediaId,
        type: proof.type,
        note: proof.note,
        publicUrl: proof.media.publicUrl ?? null,
        createdAt: proof.createdAt,
      })),
    };
  }
}
