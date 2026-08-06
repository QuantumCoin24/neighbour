import type {
  MarketplaceDisputeEvidenceType,
  MarketplaceDisputeEventType,
  MarketplaceDisputePriority,
  MarketplaceDisputeReason,
  MarketplaceDisputeResolution,
  MarketplaceDisputeStatus,
} from '../../../generated/prisma/client';

export interface MarketplaceDisputeEvidenceResponse {
  id: string;
  disputeId: string;
  uploadedById: string;
  mediaId: string;
  type: MarketplaceDisputeEvidenceType;
  description: string | null;
  publicUrl: string | null;
  createdAt: Date;
}

export interface MarketplaceDisputeMessageResponse {
  id: string;
  disputeId: string;
  authorId: string;
  message: string;
  internal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketplaceDisputeEventResponse {
  id: string;
  actorId: string | null;
  type: MarketplaceDisputeEventType;
  fromStatus: MarketplaceDisputeStatus | null;
  toStatus: MarketplaceDisputeStatus;
  note: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface MarketplaceDisputeResponse {
  id: string;
  transactionId: string;
  paymentId: string | null;
  fulfilmentId: string | null;
  openedById: string;
  buyerId: string;
  sellerId: string;
  assignedToId: string | null;
  reason: MarketplaceDisputeReason;
  status: MarketplaceDisputeStatus;
  priority: MarketplaceDisputePriority;
  title: string;
  description: string;
  requestedResolution: string | null;
  proposedResolution: string | null;
  resolution: MarketplaceDisputeResolution | null;
  resolutionDecision: string | null;
  resolutionInstructions: string | null;
  refundAmountPence: number | null;
  responseDueAt: Date | null;
  firstResponseAt: Date | null;
  reviewStartedAt: Date | null;
  escalatedAt: Date | null;
  resolvedAt: Date | null;
  closedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  evidence: MarketplaceDisputeEvidenceResponse[];
  messages: MarketplaceDisputeMessageResponse[];
  events: MarketplaceDisputeEventResponse[];
}

export interface MarketplaceDisputeHealthResponse {
  service: 'Marketplace DisputeOS';
  status: 'READY';
  architecture: 'AUDIT_DRIVEN';
  evidenceEnabled: true;
  mediationEnabled: true;
}
