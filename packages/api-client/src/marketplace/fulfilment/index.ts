import { apiRequest } from '../../client';

import type {
  CreateCollectionInput,
  CreateDeliveryInput,
  CreateMarketplaceFulfilmentInput,
  MarketplaceFulfilment,
  UploadFulfilmentProofInput,
} from './types';

export function createMarketplaceFulfilment(
  transactionId: string,
  input: CreateMarketplaceFulfilmentInput,
): Promise<MarketplaceFulfilment> {
  return apiRequest<MarketplaceFulfilment>(
    `/marketplace/fulfilments/transactions/${encodeURIComponent(transactionId)}`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export function getMarketplaceFulfilment(fulfilmentId: string): Promise<MarketplaceFulfilment> {
  return apiRequest<MarketplaceFulfilment>(
    `/marketplace/fulfilments/${encodeURIComponent(fulfilmentId)}`,
  );
}

export function getMarketplaceFulfilmentByTransaction(
  transactionId: string,
): Promise<MarketplaceFulfilment> {
  return apiRequest<MarketplaceFulfilment>(
    `/marketplace/fulfilments/transactions/${encodeURIComponent(transactionId)}`,
  );
}

export function createMarketplaceCollection(
  fulfilmentId: string,
  input: CreateCollectionInput,
): Promise<MarketplaceFulfilment> {
  return apiRequest<MarketplaceFulfilment>(
    `/marketplace/fulfilments/${encodeURIComponent(fulfilmentId)}/collection`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export function createMarketplaceDelivery(
  fulfilmentId: string,
  input: CreateDeliveryInput,
): Promise<MarketplaceFulfilment> {
  return apiRequest<MarketplaceFulfilment>(
    `/marketplace/fulfilments/${encodeURIComponent(fulfilmentId)}/delivery`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export function generateMarketplaceFulfilmentPin(fulfilmentId: string): Promise<{
  pin: string;
  expiresAt: string;
}> {
  return apiRequest(`/marketplace/fulfilments/${encodeURIComponent(fulfilmentId)}/pin`, {
    method: 'POST',
  });
}

export function generateMarketplaceFulfilmentQr(fulfilmentId: string): Promise<{
  token: string;
  expiresAt: string;
}> {
  return apiRequest(`/marketplace/fulfilments/${encodeURIComponent(fulfilmentId)}/qr`, {
    method: 'POST',
  });
}

export function verifyMarketplaceFulfilmentPin(
  fulfilmentId: string,
  pin: string,
): Promise<MarketplaceFulfilment> {
  return apiRequest<MarketplaceFulfilment>(
    `/marketplace/fulfilments/${encodeURIComponent(fulfilmentId)}/pin/verify`,
    {
      method: 'POST',
      body: JSON.stringify({
        pin,
      }),
    },
  );
}

export function verifyMarketplaceFulfilmentQr(
  fulfilmentId: string,
  token: string,
): Promise<MarketplaceFulfilment> {
  return apiRequest<MarketplaceFulfilment>(
    `/marketplace/fulfilments/${encodeURIComponent(fulfilmentId)}/qr/verify`,
    {
      method: 'POST',
      body: JSON.stringify({
        token,
      }),
    },
  );
}

export function uploadMarketplaceFulfilmentProof(
  fulfilmentId: string,
  input: UploadFulfilmentProofInput,
): Promise<MarketplaceFulfilment> {
  return apiRequest<MarketplaceFulfilment>(
    `/marketplace/fulfilments/${encodeURIComponent(fulfilmentId)}/proofs`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export function confirmMarketplaceFulfilment(fulfilmentId: string): Promise<MarketplaceFulfilment> {
  return apiRequest<MarketplaceFulfilment>(
    `/marketplace/fulfilments/${encodeURIComponent(fulfilmentId)}/confirm`,
    {
      method: 'POST',
    },
  );
}

export * from './types';
