import type {
  MarketplacePaymentEventType,
  MarketplacePaymentMethod,
  MarketplacePaymentProvider,
  MarketplacePaymentStatus,
  MarketplaceRefundStatus,
} from '../../../generated/prisma/client';

export interface MarketplacePaymentEventResponse {
  id: string;
  actorId: string;
  type: MarketplacePaymentEventType;
  fromStatus: MarketplacePaymentStatus | null;
  toStatus: MarketplacePaymentStatus;
  amountPence: number | null;
  note: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface MarketplaceRefundResponse {
  id: string;
  paymentId: string;
  requestedById: string;
  status: MarketplaceRefundStatus;
  amountPence: number;
  reason: string | null;
  providerReference: string | null;
  failureReason: string | null;
  requestedAt: Date;
  completedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketplacePaymentResponse {
  id: string;
  transactionId: string;
  buyerId: string;
  sellerId: string;
  provider: MarketplacePaymentProvider;
  method: MarketplacePaymentMethod;
  status: MarketplacePaymentStatus;
  amountPence: number;
  platformFeeBasisPoints: number;
  platformFeePence: number;
  processorFeePence: number;
  sellerProceedsPence: number;
  currency: string;
  providerReference: string | null;
  clientSecret: string | null;
  manualReference: string | null;
  failureReason: string | null;
  authorisedAt: Date | null;
  capturedAt: Date | null;
  cancelledAt: Date | null;
  refundedAmountPence: number;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  events: MarketplacePaymentEventResponse[];
  refunds: MarketplaceRefundResponse[];
}

export interface MarketplacePaymentHealthResponse {
  service: 'Marketplace PaymentOS';
  status: 'READY';
  architecture: 'PROVIDER_NEUTRAL';
  currency: 'GBP';
}
