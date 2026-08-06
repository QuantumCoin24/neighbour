import type {
  MarketplaceModerationActionType,
  MarketplaceModerationAppealDecision,
  MarketplaceModerationEventType,
  MarketplaceModerationPriority,
  MarketplaceModerationReason,
  MarketplaceModerationStatus,
  MarketplaceModerationSubjectType,
  MarketplaceFraudSignalType,
} from '../../../generated/prisma/client';

export interface MarketplaceFraudSignalResponse {
  id: string;
  type: MarketplaceFraudSignalType;
  subjectId: string;
  weight: number;
  description: string;
  metadata: Record<string, unknown> | null;
  confirmedAt: Date | null;
  dismissedAt: Date | null;
  createdAt: Date;
}

export interface MarketplaceModerationActionResponse {
  id: string;
  type: MarketplaceModerationActionType;
  appliedById: string;
  decision: string;
  instructions: string | null;
  durationHours: number | null;
  startsAt: Date;
  expiresAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
}

export interface MarketplaceModerationAppealResponse {
  id: string;
  appellantId: string;
  grounds: string;
  requestedOutcome: string;
  decision: MarketplaceModerationAppealDecision | null;
  decisionReasons: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketplaceModerationEventResponse {
  id: string;
  actorId: string | null;
  type: MarketplaceModerationEventType;
  fromStatus: MarketplaceModerationStatus | null;
  toStatus: MarketplaceModerationStatus;
  note: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface MarketplaceModerationCaseResponse {
  id: string;
  subjectType: MarketplaceModerationSubjectType;
  subjectId: string;
  reportedUserId: string | null;
  openedById: string | null;
  assignedToId: string | null;
  status: MarketplaceModerationStatus;
  priority: MarketplaceModerationPriority;
  reason: MarketplaceModerationReason;
  title: string;
  description: string;
  riskScore: number;
  fraudScore: number;
  requiresManualReview: boolean;
  openedAt: Date;
  triagedAt: Date | null;
  reviewStartedAt: Date | null;
  resolvedAt: Date | null;
  dismissedAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  fraudSignals: MarketplaceFraudSignalResponse[];
  actions: MarketplaceModerationActionResponse[];
  appeals: MarketplaceModerationAppealResponse[];
  events: MarketplaceModerationEventResponse[];
}

export interface MarketplaceModerationHealthResponse {
  service: 'Marketplace ModerationOS';
  status: 'READY';
  architecture: 'POLICY_AND_AUDIT_DRIVEN';
  fraudScoringEnabled: true;
  appealsEnabled: true;
  sanctionsEnabled: true;
}
