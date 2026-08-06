export type MarketplacePaymentProvider = 'MANUAL' | 'STRIPE' | 'ADYEN' | 'QFN';

export type MarketplacePaymentMethod =
  'CASH_ON_COLLECTION' | 'BANK_TRANSFER' | 'CARD' | 'APPLE_PAY' | 'QFN';

export type MarketplacePaymentStatus =
  | 'PENDING'
  | 'REQUIRES_ACTION'
  | 'AUTHORISED'
  | 'CAPTURED'
  | 'FAILED'
  | 'CANCELLED'
  | 'PARTIALLY_REFUNDED'
  | 'REFUNDED';

export interface MarketplacePaymentEvent {
  id: string;
  actorId: string;
  type: string;
  fromStatus: MarketplacePaymentStatus | null;
  toStatus: MarketplacePaymentStatus;
  amountPence: number | null;
  note: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface MarketplaceRefund {
  id: string;
  paymentId: string;
  requestedById: string;
  status: string;
  amountPence: number;
  reason: string | null;
  providerReference: string | null;
  failureReason: string | null;
  requestedAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplacePayment {
  id: string;
  transactionId: string;
  buyerId: string;
  sellerId: string;
  provider: MarketplacePaymentProvider;
  method: MarketplacePaymentMethod;
  status: MarketplacePaymentStatus;
  amountPence: number;
  currency: string;
  providerReference: string | null;
  clientSecret: string | null;
  manualReference: string | null;
  failureReason: string | null;
  authorisedAt: string | null;
  capturedAt: string | null;
  cancelledAt: string | null;
  refundedAmountPence: number;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  events: MarketplacePaymentEvent[];
  refunds: MarketplaceRefund[];
}

export interface CreateMarketplacePaymentInput {
  transactionId: string;
  method: MarketplacePaymentMethod;
  amountPence: number;
  reference?: string;
}
