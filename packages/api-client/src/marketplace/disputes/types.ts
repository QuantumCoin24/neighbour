export type MarketplaceDisputeStatus =
  'OPEN' | 'AWAITING_RESPONSE' | 'UNDER_REVIEW' | 'ESCALATED' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';

export type MarketplaceDisputePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type MarketplaceDisputeReason =
  | 'ITEM_NOT_RECEIVED'
  | 'ITEM_NOT_AS_DESCRIBED'
  | 'DAMAGED_ITEM'
  | 'PAYMENT_NOT_RECEIVED'
  | 'COLLECTION_NO_SHOW'
  | 'DELIVERY_PROBLEM'
  | 'UNAUTHORISED_PAYMENT'
  | 'REFUND_NOT_RECEIVED'
  | 'SAFETY_CONCERN'
  | 'OTHER';

export type MarketplaceDisputeResolution =
  | 'NO_ACTION'
  | 'BUYER_REFUND'
  | 'PARTIAL_REFUND'
  | 'SELLER_PAYMENT_RELEASE'
  | 'RETURN_ITEM'
  | 'REPLACEMENT'
  | 'MUTUAL_AGREEMENT'
  | 'ACCOUNT_RESTRICTION';

export type MarketplaceDisputeEvidenceType =
  | 'IMAGE'
  | 'VIDEO'
  | 'DOCUMENT'
  | 'RECEIPT'
  | 'TRACKING'
  | 'CONVERSATION'
  | 'PAYMENT_RECORD'
  | 'OTHER';

export interface MarketplaceDisputeEvidence {
  id: string;
  disputeId: string;
  uploadedById: string;
  mediaId: string;
  type: MarketplaceDisputeEvidenceType;
  description: string | null;
  publicUrl: string | null;
  createdAt: string;
}

export interface MarketplaceDisputeMessage {
  id: string;
  disputeId: string;
  authorId: string;
  message: string;
  internal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceDisputeEvent {
  id: string;
  actorId: string | null;
  type: string;
  fromStatus: MarketplaceDisputeStatus | null;
  toStatus: MarketplaceDisputeStatus;
  note: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface MarketplaceDispute {
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
  responseDueAt: string | null;
  firstResponseAt: string | null;
  reviewStartedAt: string | null;
  escalatedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  evidence: MarketplaceDisputeEvidence[];
  messages: MarketplaceDisputeMessage[];
  events: MarketplaceDisputeEvent[];
}
