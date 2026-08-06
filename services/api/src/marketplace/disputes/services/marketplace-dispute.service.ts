import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DatabaseService } from '../../../database/database.service';
import {
  MarketplaceDisputeEventType,
  MarketplaceDisputePriority,
  MarketplaceDisputeStatus,
  MarketplaceTransactionStatus,
  NotificationType,
  Prisma,
} from '../../../generated/prisma/client';

import type { AddMarketplaceDisputeEvidenceDto } from '../dto/add-marketplace-dispute-evidence.dto';
import type { AddMarketplaceDisputeMessageDto } from '../dto/add-marketplace-dispute-message.dto';
import type { CloseMarketplaceDisputeDto } from '../dto/close-marketplace-dispute.dto';
import type { CreateMarketplaceDisputeDto } from '../dto/create-marketplace-dispute.dto';
import type { EscalateMarketplaceDisputeDto } from '../dto/escalate-marketplace-dispute.dto';
import type { RespondMarketplaceDisputeDto } from '../dto/respond-marketplace-dispute.dto';
import type {
  MarketplaceDisputeHealthResponse,
  MarketplaceDisputeResponse,
} from '../interfaces/marketplace-dispute-response.interface';
import { MarketplaceDisputeStateMachineService } from '../state-machine/marketplace-dispute-state-machine.service';

const ACTIVE_STATUSES: MarketplaceDisputeStatus[] = [
  MarketplaceDisputeStatus.OPEN,
  MarketplaceDisputeStatus.AWAITING_RESPONSE,
  MarketplaceDisputeStatus.UNDER_REVIEW,
  MarketplaceDisputeStatus.ESCALATED,
];

const disputeInclude = {
  evidence: {
    include: {
      media: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  },
  messages: {
    where: {
      internal: false,
    },
    orderBy: {
      createdAt: 'asc',
    },
  },
  events: {
    orderBy: {
      createdAt: 'asc',
    },
  },
} satisfies Prisma.MarketplaceDisputeInclude;

type DisputeWithRelations = Prisma.MarketplaceDisputeGetPayload<{
  include: typeof disputeInclude;
}>;

@Injectable()
export class MarketplaceDisputeService {
  constructor(
    private readonly database: DatabaseService,
    private readonly stateMachine: MarketplaceDisputeStateMachineService,
  ) {}

  getHealth(): MarketplaceDisputeHealthResponse {
    return {
      service: 'Marketplace DisputeOS',
      status: 'READY',
      architecture: 'AUDIT_DRIVEN',
      evidenceEnabled: true,
      mediationEnabled: true,
    };
  }

  getRules() {
    return {
      completedOrActiveTransactionRequired: true,
      participantOnlyCreation: true,
      duplicateOpenDisputesPrevented: true,
      evidenceVaultEnabled: true,
      immutableEventTimeline: true,
      responseWindowHours: 72,
      automaticEscalationEnabled: true,
      paymentIntegrationEnabled: true,
      reputationIntegrationEnabled: true,
      moderationRequiredForFinalResolution: true,
    };
  }

  getAllowedTransitions(status: MarketplaceDisputeStatus) {
    return {
      status,
      allowedTransitions: this.stateMachine.getAllowedTransitions(status),
    };
  }

  async create(
    userId: string,
    dto: CreateMarketplaceDisputeDto,
  ): Promise<MarketplaceDisputeResponse> {
    const transaction = await this.database.marketplaceTransaction.findFirst({
      where: {
        id: dto.transactionId,
        status: {
          not: MarketplaceTransactionStatus.CANCELLED,
        },
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
      throw new NotFoundException('Eligible Marketplace transaction not found.');
    }

    const existing = await this.database.marketplaceDispute.findFirst({
      where: {
        transactionId: transaction.id,
        status: {
          in: ACTIVE_STATUSES,
        },
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      throw new ConflictException('An active dispute already exists for this transaction.');
    }

    const [payment, fulfilment] = await Promise.all([
      this.database.marketplacePayment.findFirst({
        where: {
          transactionId: transaction.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
        },
      }),
      this.database.marketplaceFulfilment.findUnique({
        where: {
          transactionId: transaction.id,
        },
        select: {
          id: true,
        },
      }),
    ]);

    const responseDueAt = new Date(Date.now() + 72 * 60 * 60 * 1_000);

    const priority =
      dto.reason === 'SAFETY_CONCERN' || dto.reason === 'UNAUTHORISED_PAYMENT'
        ? MarketplaceDisputePriority.URGENT
        : MarketplaceDisputePriority.NORMAL;

    const created = await this.database.$transaction(async (tx) => {
      const dispute = await tx.marketplaceDispute.create({
        data: {
          transactionId: transaction.id,
          paymentId: payment?.id ?? null,
          fulfilmentId: fulfilment?.id ?? null,
          openedById: userId,
          buyerId: transaction.buyerId,
          sellerId: transaction.sellerId,
          reason: dto.reason,
          status: MarketplaceDisputeStatus.AWAITING_RESPONSE,
          priority,
          title: dto.title.trim(),
          description: dto.description.trim(),
          requestedResolution: dto.requestedResolution?.trim() || null,
          responseDueAt,
        },
      });

      await tx.marketplaceDisputeEvent.createMany({
        data: [
          {
            disputeId: dispute.id,
            actorId: userId,
            type: MarketplaceDisputeEventType.CREATED,
            toStatus: MarketplaceDisputeStatus.OPEN,
            note: 'Marketplace dispute opened.',
          },
          {
            disputeId: dispute.id,
            actorId: userId,
            type: MarketplaceDisputeEventType.RESPONSE_REQUESTED,
            fromStatus: MarketplaceDisputeStatus.OPEN,
            toStatus: MarketplaceDisputeStatus.AWAITING_RESPONSE,
            metadata: {
              responseDueAt: responseDueAt.toISOString(),
            },
          },
        ],
      });

      return tx.marketplaceDispute.findUniqueOrThrow({
        where: {
          id: dispute.id,
        },
        include: disputeInclude,
      });
    });

    await this.notifyOtherParticipant(created, userId, 'created');

    return this.map(created);
  }

  async listMine(userId: string): Promise<MarketplaceDisputeResponse[]> {
    const disputes = await this.database.marketplaceDispute.findMany({
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
      include: disputeInclude,
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return disputes.map((dispute) => this.map(dispute));
  }

  async findOne(userId: string, disputeId: string): Promise<MarketplaceDisputeResponse> {
    return this.map(await this.requireParticipant(userId, disputeId));
  }

  async addMessage(
    userId: string,
    disputeId: string,
    dto: AddMarketplaceDisputeMessageDto,
  ): Promise<MarketplaceDisputeResponse> {
    const dispute = await this.requireActiveParticipant(userId, disputeId);

    await this.database.$transaction(async (tx) => {
      await tx.marketplaceDisputeMessage.create({
        data: {
          disputeId,
          authorId: userId,
          message: dto.message.trim(),
          internal: false,
        },
      });

      await tx.marketplaceDisputeEvent.create({
        data: {
          disputeId,
          actorId: userId,
          type: MarketplaceDisputeEventType.MESSAGE_ADDED,
          fromStatus: dispute.status,
          toStatus: dispute.status,
        },
      });
    });

    await this.notifyOtherParticipant(dispute, userId, 'message');

    return this.findOne(userId, disputeId);
  }

  async respond(
    userId: string,
    disputeId: string,
    dto: RespondMarketplaceDisputeDto,
  ): Promise<MarketplaceDisputeResponse> {
    const dispute = await this.requireActiveParticipant(userId, disputeId);

    if (dispute.openedById === userId) {
      throw new ForbiddenException('The dispute opener cannot submit the formal response.');
    }

    if (dispute.status !== MarketplaceDisputeStatus.AWAITING_RESPONSE) {
      throw new ConflictException('This dispute is not awaiting a response.');
    }

    const nextStatus = MarketplaceDisputeStatus.UNDER_REVIEW;

    this.stateMachine.requireTransition(dispute.status, nextStatus);

    const now = new Date();

    await this.database.$transaction(async (tx) => {
      await tx.marketplaceDisputeMessage.create({
        data: {
          disputeId,
          authorId: userId,
          message: dto.response.trim(),
          internal: false,
        },
      });

      await tx.marketplaceDispute.update({
        where: {
          id: disputeId,
        },
        data: {
          status: nextStatus,
          proposedResolution: dto.proposedResolution?.trim() || null,
          firstResponseAt: dispute.firstResponseAt ?? now,
          reviewStartedAt: dispute.reviewStartedAt ?? now,
        },
      });

      await tx.marketplaceDisputeEvent.createMany({
        data: [
          {
            disputeId,
            actorId: userId,
            type: MarketplaceDisputeEventType.RESPONSE_ADDED,
            fromStatus: dispute.status,
            toStatus: dispute.status,
          },
          {
            disputeId,
            actorId: userId,
            type: MarketplaceDisputeEventType.REVIEW_STARTED,
            fromStatus: dispute.status,
            toStatus: nextStatus,
          },
        ],
      });
    });

    await this.notifyOtherParticipant(dispute, userId, 'responded');

    return this.findOne(userId, disputeId);
  }

  async addEvidence(
    userId: string,
    disputeId: string,
    dto: AddMarketplaceDisputeEvidenceDto,
  ): Promise<MarketplaceDisputeResponse> {
    const dispute = await this.requireActiveParticipant(userId, disputeId);

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
      throw new ForbiddenException('The selected evidence media is unavailable.');
    }

    await this.database.$transaction(async (tx) => {
      await tx.marketplaceDisputeEvidence.create({
        data: {
          disputeId,
          uploadedById: userId,
          mediaId: dto.mediaId,
          type: dto.type,
          description: dto.description?.trim() || null,
        },
      });

      await tx.marketplaceDisputeEvent.create({
        data: {
          disputeId,
          actorId: userId,
          type: MarketplaceDisputeEventType.EVIDENCE_ADDED,
          fromStatus: dispute.status,
          toStatus: dispute.status,
          metadata: {
            evidenceType: dto.type,
            mediaId: dto.mediaId,
          },
        },
      });
    });

    await this.notifyOtherParticipant(dispute, userId, 'evidence');

    return this.findOne(userId, disputeId);
  }

  async escalate(
    userId: string,
    disputeId: string,
    dto: EscalateMarketplaceDisputeDto,
  ): Promise<MarketplaceDisputeResponse> {
    const dispute = await this.requireActiveParticipant(userId, disputeId);

    const nextStatus = MarketplaceDisputeStatus.ESCALATED;

    this.stateMachine.requireTransition(dispute.status, nextStatus);

    const note = [dto.reason.trim(), dto.additionalContext?.trim()].filter(Boolean).join('\n\n');

    await this.database.$transaction(async (tx) => {
      await tx.marketplaceDispute.update({
        where: {
          id: disputeId,
        },
        data: {
          status: nextStatus,
          priority:
            dispute.priority === MarketplaceDisputePriority.URGENT
              ? MarketplaceDisputePriority.URGENT
              : MarketplaceDisputePriority.HIGH,
          escalatedAt: new Date(),
        },
      });

      await tx.marketplaceDisputeEvent.create({
        data: {
          disputeId,
          actorId: userId,
          type: MarketplaceDisputeEventType.ESCALATED,
          fromStatus: dispute.status,
          toStatus: nextStatus,
          note,
        },
      });
    });

    await this.notifyOtherParticipant(dispute, userId, 'escalated');

    return this.findOne(userId, disputeId);
  }

  async cancel(
    userId: string,
    disputeId: string,
    dto: CloseMarketplaceDisputeDto,
  ): Promise<MarketplaceDisputeResponse> {
    const dispute = await this.requireActiveParticipant(userId, disputeId);

    if (dispute.openedById !== userId) {
      throw new ForbiddenException('Only the dispute opener may cancel it.');
    }

    const nextStatus = MarketplaceDisputeStatus.CANCELLED;

    this.stateMachine.requireTransition(dispute.status, nextStatus);

    await this.database.$transaction(async (tx) => {
      await tx.marketplaceDispute.update({
        where: {
          id: disputeId,
        },
        data: {
          status: nextStatus,
          cancelledAt: new Date(),
        },
      });

      await tx.marketplaceDisputeEvent.create({
        data: {
          disputeId,
          actorId: userId,
          type: MarketplaceDisputeEventType.CANCELLED,
          fromStatus: dispute.status,
          toStatus: nextStatus,
          note: dto.note?.trim() || null,
        },
      });
    });

    await this.notifyOtherParticipant(dispute, userId, 'cancelled');

    return this.findOne(userId, disputeId);
  }

  async processOverdueResponses(): Promise<{
    escalated: number;
  }> {
    const overdue = await this.database.marketplaceDispute.findMany({
      where: {
        status: MarketplaceDisputeStatus.AWAITING_RESPONSE,
        responseDueAt: {
          lt: new Date(),
        },
      },
      select: {
        id: true,
      },
    });

    let escalated = 0;

    for (const dispute of overdue) {
      const updated = await this.database.marketplaceDispute.updateMany({
        where: {
          id: dispute.id,
          status: MarketplaceDisputeStatus.AWAITING_RESPONSE,
        },
        data: {
          status: MarketplaceDisputeStatus.ESCALATED,
          priority: MarketplaceDisputePriority.HIGH,
          escalatedAt: new Date(),
        },
      });

      if (updated.count === 0) {
        continue;
      }

      await this.database.marketplaceDisputeEvent.create({
        data: {
          disputeId: dispute.id,
          type: MarketplaceDisputeEventType.ESCALATED,
          fromStatus: MarketplaceDisputeStatus.AWAITING_RESPONSE,
          toStatus: MarketplaceDisputeStatus.ESCALATED,
          note: 'Automatically escalated after the response deadline expired.',
        },
      });

      escalated += 1;
    }

    return {
      escalated,
    };
  }

  private async requireParticipant(
    userId: string,
    disputeId: string,
  ): Promise<DisputeWithRelations> {
    const dispute = await this.database.marketplaceDispute.findFirst({
      where: {
        id: disputeId,
        OR: [
          {
            buyerId: userId,
          },
          {
            sellerId: userId,
          },
        ],
      },
      include: disputeInclude,
    });

    if (!dispute) {
      throw new NotFoundException('Marketplace dispute not found.');
    }

    return dispute;
  }

  private async requireActiveParticipant(
    userId: string,
    disputeId: string,
  ): Promise<DisputeWithRelations> {
    const dispute = await this.requireParticipant(userId, disputeId);

    if (!ACTIVE_STATUSES.includes(dispute.status)) {
      throw new ConflictException('This Marketplace dispute is no longer active.');
    }

    return dispute;
  }

  private async notifyOtherParticipant(
    dispute: DisputeWithRelations,
    actorId: string,
    event: string,
  ): Promise<void> {
    const recipientId = actorId === dispute.buyerId ? dispute.sellerId : dispute.buyerId;

    if (recipientId === actorId) {
      return;
    }

    const idempotencyKey = `marketplace-dispute:${dispute.id}:${event}:${recipientId}`;

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

  private map(dispute: DisputeWithRelations): MarketplaceDisputeResponse {
    return {
      id: dispute.id,
      transactionId: dispute.transactionId,
      paymentId: dispute.paymentId,
      fulfilmentId: dispute.fulfilmentId,
      openedById: dispute.openedById,
      buyerId: dispute.buyerId,
      sellerId: dispute.sellerId,
      assignedToId: dispute.assignedToId,
      reason: dispute.reason,
      status: dispute.status,
      priority: dispute.priority,
      title: dispute.title,
      description: dispute.description,
      requestedResolution: dispute.requestedResolution,
      proposedResolution: dispute.proposedResolution,
      resolution: dispute.resolution,
      resolutionDecision: dispute.resolutionDecision,
      resolutionInstructions: dispute.resolutionInstructions,
      refundAmountPence: dispute.refundAmountPence,
      responseDueAt: dispute.responseDueAt,
      firstResponseAt: dispute.firstResponseAt,
      reviewStartedAt: dispute.reviewStartedAt,
      escalatedAt: dispute.escalatedAt,
      resolvedAt: dispute.resolvedAt,
      closedAt: dispute.closedAt,
      cancelledAt: dispute.cancelledAt,
      createdAt: dispute.createdAt,
      updatedAt: dispute.updatedAt,
      evidence: dispute.evidence.map((evidence) => ({
        id: evidence.id,
        disputeId: evidence.disputeId,
        uploadedById: evidence.uploadedById,
        mediaId: evidence.mediaId,
        type: evidence.type,
        description: evidence.description,
        publicUrl: evidence.media.publicUrl ?? null,
        createdAt: evidence.createdAt,
      })),
      messages: dispute.messages,
      events: dispute.events.map((event) => ({
        id: event.id,
        actorId: event.actorId,
        type: event.type,
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
        note: event.note,
        metadata:
          event.metadata && typeof event.metadata === 'object' && !Array.isArray(event.metadata)
            ? (event.metadata as Record<string, unknown>)
            : null,
        createdAt: event.createdAt,
      })),
    };
  }
}
