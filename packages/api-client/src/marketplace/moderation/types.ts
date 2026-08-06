export type MarketplaceModerationSubjectType =
  'LISTING' | 'USER' | 'TRANSACTION' | 'PAYMENT' | 'FULFILMENT' | 'REVIEW' | 'DISPUTE' | 'MESSAGE';

export type MarketplaceModerationStatus =
  | 'OPEN'
  | 'TRIAGED'
  | 'UNDER_REVIEW'
  | 'AWAITING_INFORMATION'
  | 'ACTION_REQUIRED'
  | 'RESOLVED'
  | 'DISMISSED'
  | 'APPEALED'
  | 'CLOSED';

export type MarketplaceModerationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL';

export interface MarketplaceFraudSignal {
  id: string;
  type: string;
  subjectId: string;
  weight: number;
  description: string;
  metadata: Record<string, unknown> | null;
  confirmedAt: string | null;
  dismissedAt: string | null;
  createdAt: string;
}

export interface MarketplaceModerationAction {
  id: string;
  type: string;
  appliedById: string;
  decision: string;
  instructions: string | null;
  durationHours: number | null;
  startsAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export interface MarketplaceModerationAppeal {
  id: string;
  appellantId: string;
  grounds: string;
  requestedOutcome: string;
  decision: string | null;
  decisionReasons: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceModerationEvent {
  id: string;
  actorId: string | null;
  type: string;
  fromStatus: MarketplaceModerationStatus | null;
  toStatus: MarketplaceModerationStatus;
  note: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface MarketplaceModerationCase {
  id: string;
  subjectType: MarketplaceModerationSubjectType;
  subjectId: string;
  reportedUserId: string | null;
  openedById: string | null;
  assignedToId: string | null;
  status: MarketplaceModerationStatus;
  priority: MarketplaceModerationPriority;
  reason: string;
  title: string;
  description: string;
  riskScore: number;
  fraudScore: number;
  requiresManualReview: boolean;
  openedAt: string;
  triagedAt: string | null;
  reviewStartedAt: string | null;
  resolvedAt: string | null;
  dismissedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  fraudSignals: MarketplaceFraudSignal[];
  actions: MarketplaceModerationAction[];
  appeals: MarketplaceModerationAppeal[];
  events: MarketplaceModerationEvent[];
}
