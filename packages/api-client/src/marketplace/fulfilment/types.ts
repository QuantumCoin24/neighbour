export type MarketplaceFulfilmentMethod = 'COLLECTION' | 'DELIVERY' | 'POSTAGE';

export type MarketplaceFulfilmentStatus =
  | 'PENDING'
  | 'SCHEDULED'
  | 'READY'
  | 'IN_PROGRESS'
  | 'AWAITING_CONFIRMATION'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

export type MarketplaceFulfilmentEventType =
  | 'CREATED'
  | 'METHOD_SELECTED'
  | 'COLLECTION_SCHEDULED'
  | 'DELIVERY_SCHEDULED'
  | 'PIN_GENERATED'
  | 'QR_GENERATED'
  | 'READY_FOR_HANDOVER'
  | 'HANDOVER_VERIFIED'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'BUYER_CONFIRMED'
  | 'SELLER_CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'PROOF_ADDED';

export type MarketplaceProofType =
  'COLLECTION_PHOTO' | 'DELIVERY_PHOTO' | 'RECEIPT' | 'SIGNATURE' | 'OTHER';

export interface FulfilmentTimelineItem {
  id: string;
  actorId: string;
  type: MarketplaceFulfilmentEventType;
  note: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface FulfilmentProof {
  id: string;
  uploadedById: string;
  mediaId: string;
  type: MarketplaceProofType;
  note: string | null;
  publicUrl: string | null;
  createdAt: string;
}

export interface MarketplaceFulfilment {
  id: string;
  transactionId: string;
  method: MarketplaceFulfilmentMethod;
  status: MarketplaceFulfilmentStatus;
  buyerConfirmedAt: string | null;
  sellerConfirmedAt: string | null;
  scheduledAt: string | null;
  readyAt: string | null;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  collection: {
    id: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    postcode: string;
    instructions: string | null;
    scheduledFor: string;
    collectorArrivedAt: string | null;
    handoverVerifiedAt: string | null;
    completedAt: string | null;
  } | null;
  delivery: {
    id: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    postcode: string;
    courier: string | null;
    trackingNumber: string | null;
    instructions: string | null;
    scheduledFor: string | null;
    dispatchedAt: string | null;
    deliveredAt: string | null;
  } | null;
  timeline: FulfilmentTimelineItem[];
  proofs: FulfilmentProof[];
}

export interface CreateMarketplaceFulfilmentInput {
  method: MarketplaceFulfilmentMethod;
}

export interface CreateCollectionInput {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postcode: string;
  instructions?: string;
  scheduledFor: string;
}

export interface CreateDeliveryInput {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postcode?: string;
  courier?: string;
  trackingNumber?: string;
  instructions?: string;
  scheduledFor?: string;
}

export interface UploadFulfilmentProofInput {
  mediaId: string;
  type: MarketplaceProofType;
  note?: string;
}
