import { apiRequest } from '../../client';

import type { CreateMarketplacePaymentInput, MarketplacePayment } from './types';

export function createMarketplacePayment(
  input: CreateMarketplacePaymentInput,
): Promise<MarketplacePayment> {
  return apiRequest<MarketplacePayment>('/marketplace/payments', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getMyMarketplacePayments(): Promise<MarketplacePayment[]> {
  return apiRequest<MarketplacePayment[]>('/marketplace/payments/mine');
}

export function getMarketplacePayment(paymentId: string): Promise<MarketplacePayment> {
  return apiRequest<MarketplacePayment>(`/marketplace/payments/${encodeURIComponent(paymentId)}`);
}

export function confirmMarketplacePayment(
  paymentId: string,
  providerReference?: string,
): Promise<MarketplacePayment> {
  return apiRequest<MarketplacePayment>(
    `/marketplace/payments/${encodeURIComponent(paymentId)}/confirm`,
    {
      method: 'POST',
      body: JSON.stringify({
        ...(providerReference
          ? {
              providerReference,
            }
          : {}),
      }),
    },
  );
}

export function cancelMarketplacePayment(
  paymentId: string,
  reason: string,
): Promise<MarketplacePayment> {
  return apiRequest<MarketplacePayment>(
    `/marketplace/payments/${encodeURIComponent(paymentId)}/cancel`,
    {
      method: 'POST',
      body: JSON.stringify({
        reason,
      }),
    },
  );
}

export function refundMarketplacePayment(
  paymentId: string,
  amountPence: number,
  reason?: string,
): Promise<MarketplacePayment> {
  return apiRequest<MarketplacePayment>(
    `/marketplace/payments/${encodeURIComponent(paymentId)}/refunds`,
    {
      method: 'POST',
      body: JSON.stringify({
        amountPence,
        ...(reason
          ? {
              reason,
            }
          : {}),
      }),
    },
  );
}

export function getMarketplacePaymentMethods() {
  return apiRequest<{
    currency: 'GBP';
    methods: Array<{
      id: string;
      provider: string;
      enabled: boolean;
    }>;
  }>('/marketplace/payments/methods');
}

export * from './types';
