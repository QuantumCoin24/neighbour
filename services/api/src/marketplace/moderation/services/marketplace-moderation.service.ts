import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { DatabaseService } from '../../../database/database.service';
import {
  MarketplaceModerationEventType,
  MarketplaceModerationPriority,
  MarketplaceModerationStatus,
  Prisma,
} from '../../../generated/prisma/client';

import type { AddMarketplaceFraudSignalDto } from '../dto/add-marketplace-fraud-signal.dto';
import type { AssignMarketplaceModerationCaseDto } from '../dto/assign-marketplace-moderation-case.dto';
import type { CreateMarketplaceModerationCaseDto } from '../dto/create-marketplace-moderation-case.dto';
import type { UpdateMarketplaceModerationStatusDto } from '../dto/update-marketplace-moderation-status.dto';
import type {
  MarketplaceModerationCaseResponse,
  MarketplaceModerationHealthResponse,
} from '../interfaces/marketplace-moderation-response.interface';
import { MarketplaceModerationPolicyService } from '../policy/marketplace-moderation-policy.service';
import { MarketplaceModerationRiskScoreService } from '../scoring/marketplace-moderation-risk-score.service';
import { MarketplaceModerationStateMachineService } from '../state-machine/marketplace-moderation-state-machine.service';

const moderationInclude = {
  fraudSignals: {
    orderBy: {
      createdAt: 'asc',
    },
  },
  actions: {
    orderBy: {
      createdAt: 'asc',
    },
  },
  appeals: {
    orderBy: {
      createdAt: 'asc',
    },
  },
  events: {
    orderBy: {
      createdAt: 'asc',
    },
  },
} satisfies Prisma.MarketplaceModerationCaseInclude;

type ModerationCaseWithRelations = Prisma.MarketplaceModerationCaseGetPayload<{
  include: typeof moderationInclude;
}>;

@Injectable()
export class MarketplaceModerationService {
  constructor(
    private readonly database: DatabaseService,
    private readonly policy: MarketplaceModerationPolicyService,
    private readonly scoring: MarketplaceModerationRiskScoreService,
    private readonly stateMachine: MarketplaceModerationStateMachineService,
  ) {}

  getHealth(): MarketplaceModerationHealthResponse {
    return {
      service: 'Marketplace ModerationOS',
      status: 'READY',
      architecture: 'POLICY_AND_AUDIT_DRIVEN',
      fraudScoringEnabled: true,
      appealsEnabled: true,
      sanctionsEnabled: true,
    };
  }

  getRules() {
    return {
      immutableAuditTimeline: true,
      evidenceRequiredForSevereActions: true,
      appealsEnabled: true,
      secondReviewerForSevereActions: true,
      automatedRiskScoring: true,
      automaticAccountTermination: false,
      humanReviewForSevereSanctions: true,
      paymentHoldSupported: true,
      reputationIntegrationEnabled: true,
      disputeIntegrationEnabled: true,
    };
  }

  getAllowedTransitions(status: MarketplaceModerationStatus) {
    return {
      status,
      allowedTransitions: this.stateMachine.getAllowedTransitions(status),
    };
  }

  getRecommendedActions(priority: MarketplaceModerationPriority) {
    return {
      priority,
      actions: this.policy.getRecommendedActions(priority),
    };
  }

  async createCase(
    actorId: string,
    dto: CreateMarketplaceModerationCaseDto,
  ): Promise<MarketplaceModerationCaseResponse> {
    const duplicate = await this.database.marketplaceModerationCase.findFirst({
      where: {
        subjectType: dto.subjectType,
        subjectId: dto.subjectId,
        status: {
          in: [
            MarketplaceModerationStatus.OPEN,
            MarketplaceModerationStatus.TRIAGED,
            MarketplaceModerationStatus.UNDER_REVIEW,
            MarketplaceModerationStatus.AWAITING_INFORMATION,
            MarketplaceModerationStatus.ACTION_REQUIRED,
            MarketplaceModerationStatus.APPEALED,
          ],
        },
      },
      include: moderationInclude,
    });

    if (duplicate) {
      throw new ConflictException('An active moderation case already exists for this subject.');
    }

    const initialPriority =
      dto.reason === 'THREAT_OR_SAFETY'
        ? MarketplaceModerationPriority.CRITICAL
        : dto.reason === 'FRAUD_SUSPECTED' || dto.reason === 'PAYMENT_ABUSE'
          ? MarketplaceModerationPriority.HIGH
          : MarketplaceModerationPriority.NORMAL;

    const created = await this.database.$transaction(async (tx) => {
      const moderationCase = await tx.marketplaceModerationCase.create({
        data: {
          subjectType: dto.subjectType,
          subjectId: dto.subjectId,
          reportedUserId: dto.reportedUserId ?? null,
          openedById: actorId,
          reason: dto.reason,
          priority: initialPriority,
          title: dto.title.trim(),
          description: dto.description.trim(),
        },
      });

      await tx.marketplaceModerationEvent.create({
        data: {
          caseId: moderationCase.id,
          actorId,
          type: MarketplaceModerationEventType.CASE_CREATED,
          toStatus: MarketplaceModerationStatus.OPEN,
          metadata: {
            subjectType: dto.subjectType,
            subjectId: dto.subjectId,
          },
        },
      });

      return tx.marketplaceModerationCase.findUniqueOrThrow({
        where: {
          id: moderationCase.id,
        },
        include: moderationInclude,
      });
    });

    return this.map(created);
  }

  async listQueue(): Promise<MarketplaceModerationCaseResponse[]> {
    const cases = await this.database.marketplaceModerationCase.findMany({
      where: {
        status: {
          notIn: [MarketplaceModerationStatus.CLOSED, MarketplaceModerationStatus.DISMISSED],
        },
      },
      include: moderationInclude,
      orderBy: [
        {
          priority: 'desc',
        },
        {
          riskScore: 'desc',
        },
        {
          createdAt: 'asc',
        },
      ],
    });

    return cases.map((item) => this.map(item));
  }

  async findOne(caseId: string): Promise<MarketplaceModerationCaseResponse> {
    const moderationCase = await this.database.marketplaceModerationCase.findUnique({
      where: {
        id: caseId,
      },
      include: moderationInclude,
    });

    if (!moderationCase) {
      throw new NotFoundException('Marketplace moderation case not found.');
    }

    return this.map(moderationCase);
  }

  async assign(
    actorId: string,
    caseId: string,
    dto: AssignMarketplaceModerationCaseDto,
  ): Promise<MarketplaceModerationCaseResponse> {
    const current = await this.requireCase(caseId);

    const nextStatus =
      current.status === MarketplaceModerationStatus.OPEN
        ? MarketplaceModerationStatus.TRIAGED
        : current.status;

    await this.database.$transaction(async (tx) => {
      await tx.marketplaceModerationCase.update({
        where: {
          id: caseId,
        },
        data: {
          assignedToId: dto.moderatorId,
          status: nextStatus,
          triagedAt: current.triagedAt ?? new Date(),
        },
      });

      await tx.marketplaceModerationEvent.create({
        data: {
          caseId,
          actorId,
          type: MarketplaceModerationEventType.ASSIGNED,
          fromStatus: current.status,
          toStatus: nextStatus,
          metadata: {
            moderatorId: dto.moderatorId,
          },
        },
      });
    });

    return this.findOne(caseId);
  }

  async addFraudSignal(
    actorId: string,
    caseId: string,
    dto: AddMarketplaceFraudSignalDto,
  ): Promise<MarketplaceModerationCaseResponse> {
    const current = await this.requireCase(caseId);

    await this.database.$transaction(async (tx) => {
      await tx.marketplaceFraudSignal.create({
        data: {
          caseId,
          createdById: actorId,
          type: dto.type,
          subjectId: dto.subjectId,
          weight: dto.weight,
          description: dto.description.trim(),
          metadata:
            dto.metadata === undefined ? Prisma.JsonNull : (dto.metadata as Prisma.InputJsonValue),
        },
      });

      await tx.marketplaceModerationEvent.create({
        data: {
          caseId,
          actorId,
          type: MarketplaceModerationEventType.FRAUD_SIGNAL_ADDED,
          fromStatus: current.status,
          toStatus: current.status,
          metadata: {
            signalType: dto.type,
            weight: dto.weight,
          },
        },
      });
    });

    await this.recalculateRisk(actorId, caseId);

    return this.findOne(caseId);
  }

  async updateStatus(
    actorId: string,
    caseId: string,
    dto: UpdateMarketplaceModerationStatusDto,
  ): Promise<MarketplaceModerationCaseResponse> {
    const current = await this.requireCase(caseId);

    const nextStatus = dto.status as MarketplaceModerationStatus;

    this.stateMachine.requireTransition(current.status, nextStatus);

    const now = new Date();

    await this.database.$transaction(async (tx) => {
      await tx.marketplaceModerationCase.update({
        where: {
          id: caseId,
        },
        data: {
          status: nextStatus,
          triagedAt:
            nextStatus === MarketplaceModerationStatus.TRIAGED
              ? (current.triagedAt ?? now)
              : current.triagedAt,
          reviewStartedAt:
            nextStatus === MarketplaceModerationStatus.UNDER_REVIEW
              ? (current.reviewStartedAt ?? now)
              : current.reviewStartedAt,
          resolvedAt:
            nextStatus === MarketplaceModerationStatus.RESOLVED ? now : current.resolvedAt,
          dismissedAt:
            nextStatus === MarketplaceModerationStatus.DISMISSED ? now : current.dismissedAt,
          closedAt: nextStatus === MarketplaceModerationStatus.CLOSED ? now : current.closedAt,
        },
      });

      await tx.marketplaceModerationEvent.create({
        data: {
          caseId,
          actorId,
          type: MarketplaceModerationEventType.STATUS_CHANGED,
          fromStatus: current.status,
          toStatus: nextStatus,
          note: dto.note?.trim() ?? null,
        },
      });
    });

    return this.findOne(caseId);
  }

  async recalculateRisk(actorId: string, caseId: string): Promise<void> {
    const current = await this.requireCase(caseId);

    const fraudSignalWeight = current.fraudSignals.reduce(
      (total, signal) => total + signal.weight,
      0,
    );

    const result = this.scoring.calculate({
      fraudSignalWeight,
      activeDisputes: 0,
      confirmedDisputes: 0,
      cancellationRate: 0,
      refundRate: 0,
      reportCount: current.fraudSignals.length,
      identityVerified: false,
      accountAgeDays: 0,
      previousWarnings: current.actions.filter((action) => action.type === 'WARNING').length,
      previousSuspensions: current.actions.filter(
        (action) => action.type === 'ACCOUNT_SUSPENDED' || action.type === 'MARKETPLACE_RESTRICTED',
      ).length,
    });

    await this.database.$transaction(async (tx) => {
      await tx.marketplaceModerationCase.update({
        where: {
          id: caseId,
        },
        data: {
          riskScore: result.riskScore,
          fraudScore: result.fraudScore,
          priority: result.priority,
          requiresManualReview: result.requiresManualReview,
        },
      });

      await tx.marketplaceModerationEvent.create({
        data: {
          caseId,
          actorId,
          type: MarketplaceModerationEventType.RISK_RECALCULATED,
          fromStatus: current.status,
          toStatus: current.status,
          metadata: {
            riskScore: result.riskScore,
            fraudScore: result.fraudScore,
            priority: result.priority,
            factors: result.factors,
          },
        },
      });
    });
  }

  private async requireCase(caseId: string): Promise<ModerationCaseWithRelations> {
    const moderationCase = await this.database.marketplaceModerationCase.findUnique({
      where: {
        id: caseId,
      },
      include: moderationInclude,
    });

    if (!moderationCase) {
      throw new NotFoundException('Marketplace moderation case not found.');
    }

    return moderationCase;
  }

  private map(moderationCase: ModerationCaseWithRelations): MarketplaceModerationCaseResponse {
    return {
      id: moderationCase.id,
      subjectType: moderationCase.subjectType,
      subjectId: moderationCase.subjectId,
      reportedUserId: moderationCase.reportedUserId,
      openedById: moderationCase.openedById,
      assignedToId: moderationCase.assignedToId,
      status: moderationCase.status,
      priority: moderationCase.priority,
      reason: moderationCase.reason,
      title: moderationCase.title,
      description: moderationCase.description,
      riskScore: moderationCase.riskScore,
      fraudScore: moderationCase.fraudScore,
      requiresManualReview: moderationCase.requiresManualReview,
      openedAt: moderationCase.openedAt,
      triagedAt: moderationCase.triagedAt,
      reviewStartedAt: moderationCase.reviewStartedAt,
      resolvedAt: moderationCase.resolvedAt,
      dismissedAt: moderationCase.dismissedAt,
      closedAt: moderationCase.closedAt,
      createdAt: moderationCase.createdAt,
      updatedAt: moderationCase.updatedAt,
      fraudSignals: moderationCase.fraudSignals.map((signal) => ({
        id: signal.id,
        type: signal.type,
        subjectId: signal.subjectId,
        weight: signal.weight,
        description: signal.description,
        metadata:
          signal.metadata && typeof signal.metadata === 'object' && !Array.isArray(signal.metadata)
            ? (signal.metadata as Record<string, unknown>)
            : null,
        confirmedAt: signal.confirmedAt,
        dismissedAt: signal.dismissedAt,
        createdAt: signal.createdAt,
      })),
      actions: moderationCase.actions.map((action) => ({
        id: action.id,
        type: action.type,
        appliedById: action.appliedById,
        decision: action.decision,
        instructions: action.instructions,
        durationHours: action.durationHours,
        startsAt: action.startsAt,
        expiresAt: action.expiresAt,
        revokedAt: action.revokedAt,
        createdAt: action.createdAt,
      })),
      appeals: moderationCase.appeals.map((appeal) => ({
        id: appeal.id,
        appellantId: appeal.appellantId,
        grounds: appeal.grounds,
        requestedOutcome: appeal.requestedOutcome,
        decision: appeal.decision,
        decisionReasons: appeal.decisionReasons,
        resolvedAt: appeal.resolvedAt,
        createdAt: appeal.createdAt,
        updatedAt: appeal.updatedAt,
      })),
      events: moderationCase.events.map((event) => ({
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
