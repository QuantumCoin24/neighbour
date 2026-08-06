import type {
  MarketplaceFulfilmentEventType,
  MarketplaceFulfilmentMethod,
  MarketplaceFulfilmentStatus,
  MarketplaceProofType,
} from '../../../generated/prisma/client';

export interface FulfilmentTimelineItemResponse {
  id: string;
  actorId: string;
  type: MarketplaceFulfilmentEventType;
  note: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface FulfilmentProofResponse {
  id: string;
  uploadedById: string;
  mediaId: string;
  type: MarketplaceProofType;
  note: string | null;
  publicUrl: string | null;
  createdAt: Date;
}

export interface MarketplaceFulfilmentResponse {
  id: string;
  transactionId: string;
  method: MarketplaceFulfilmentMethod;
  status: MarketplaceFulfilmentStatus;
  buyerConfirmedAt: Date | null;
  sellerConfirmedAt: Date | null;
  scheduledAt: Date | null;
  readyAt: Date | null;
  dispatchedAt: Date | null;
  deliveredAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  collection: {
    id: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    postcode: string;
    instructions: string | null;
    scheduledFor: Date;
    collectorArrivedAt: Date | null;
    handoverVerifiedAt: Date | null;
    completedAt: Date | null;
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
    scheduledFor: Date | null;
    dispatchedAt: Date | null;
    deliveredAt: Date | null;
  } | null;
  timeline: FulfilmentTimelineItemResponse[];
  proofs: FulfilmentProofResponse[];
}
