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

export interface MarketplaceDispute {
  id: string;
  transactionId: string;
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
  refundAmountPence: number | null;
  responseDueAt: string | null;
  escalatedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceDisputeHealth {
  service: 'Marketplace DisputeOS';
  status: 'READY';
  architecture: 'AUDIT_DRIVEN';
  evidenceEnabled: true;
  mediationEnabled: true;
}
