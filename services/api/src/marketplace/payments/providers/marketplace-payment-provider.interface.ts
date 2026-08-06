import type {
  MarketplacePaymentMethod,
  MarketplacePaymentProvider,
} from '../../../generated/prisma/client';

export interface CreateProviderPaymentInput {
  paymentId: string;
  amountPence: number;
  currency: 'GBP';
  method: MarketplacePaymentMethod;
  buyerId: string;
  sellerId: string;
  transactionId: string;
}

export interface CreateProviderPaymentResult {
  provider: MarketplacePaymentProvider;
  providerReference: string | null;
  clientSecret: string | null;
  requiresAction: boolean;
}

export interface MarketplacePaymentProviderAdapter {
  readonly provider: MarketplacePaymentProvider;

  createPayment(input: CreateProviderPaymentInput): Promise<CreateProviderPaymentResult>;

  capturePayment(providerReference: string): Promise<void>;

  cancelPayment(providerReference: string): Promise<void>;

  refundPayment(providerReference: string, amountPence: number): Promise<void>;
}
