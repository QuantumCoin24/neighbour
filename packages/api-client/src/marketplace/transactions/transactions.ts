import { apiRequest } from '../../client';

import type {
  CounterMarketplacePeerOfferInput,
  CreateMarketplacePeerOfferInput,
  MarketplaceOfferList,
  MarketplaceOfferQuery,
  MarketplacePeerOffer,
  MarketplaceTransaction,
} from './types';

function buildQuery(query: MarketplaceOfferQuery = {}): string {
  const parameters = new URLSearchParams();

  if (query.status) {
    parameters.set('status', query.status);
  }

  if (query.limit !== undefined) {
    parameters.set('limit', String(query.limit));
  }

  const value = parameters.toString();

  return value ? `?${value}` : '';
}

export function purchaseMarketplaceListing(
  listingId: string,
): Promise<MarketplaceTransaction> {
  return apiRequest<MarketplaceTransaction>(
    `/marketplace/listings/${encodeURIComponent(listingId)}/purchase`,
    {
      method: 'POST',
    },
  );
}

export function createMarketplacePeerOffer(
  listingId: string,
  input: CreateMarketplacePeerOfferInput,
): Promise<MarketplacePeerOffer> {
  return apiRequest<MarketplacePeerOffer>(
    `/marketplace/listings/${encodeURIComponent(listingId)}/offers`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export function getMarketplaceListingOffers(listingId: string): Promise<MarketplaceOfferList> {
  return apiRequest<MarketplaceOfferList>(
    `/marketplace/listings/${encodeURIComponent(listingId)}/offers`,
  );
}

export function getMyMarketplaceOffers(
  query: MarketplaceOfferQuery = {},
): Promise<MarketplaceOfferList> {
  return apiRequest<MarketplaceOfferList>(`/marketplace/offers/mine${buildQuery(query)}`);
}

export function getReceivedMarketplaceOffers(
  query: MarketplaceOfferQuery = {},
): Promise<MarketplaceOfferList> {
  return apiRequest<MarketplaceOfferList>(`/marketplace/offers/received${buildQuery(query)}`);
}

export function getMarketplacePeerOffer(offerId: string): Promise<MarketplacePeerOffer> {
  return apiRequest<MarketplacePeerOffer>(`/marketplace/offers/${encodeURIComponent(offerId)}`);
}

export function counterMarketplacePeerOffer(
  offerId: string,
  input: CounterMarketplacePeerOfferInput,
): Promise<MarketplacePeerOffer> {
  return apiRequest<MarketplacePeerOffer>(
    `/marketplace/offers/${encodeURIComponent(offerId)}/counter`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export function acceptMarketplacePeerOffer(offerId: string): Promise<MarketplacePeerOffer> {
  return apiRequest<MarketplacePeerOffer>(
    `/marketplace/offers/${encodeURIComponent(offerId)}/accept`,
    {
      method: 'POST',
    },
  );
}

export function declineMarketplacePeerOffer(offerId: string): Promise<MarketplacePeerOffer> {
  return apiRequest<MarketplacePeerOffer>(
    `/marketplace/offers/${encodeURIComponent(offerId)}/decline`,
    {
      method: 'POST',
    },
  );
}

export function withdrawMarketplacePeerOffer(offerId: string): Promise<MarketplacePeerOffer> {
  return apiRequest<MarketplacePeerOffer>(
    `/marketplace/offers/${encodeURIComponent(offerId)}/withdraw`,
    {
      method: 'POST',
    },
  );
}

export function getMarketplaceTransaction(transactionId: string): Promise<MarketplaceTransaction> {
  return apiRequest<MarketplaceTransaction>(
    `/marketplace/transactions/${encodeURIComponent(transactionId)}`,
  );
}

export function completeMarketplaceTransaction(
  transactionId: string,
): Promise<MarketplaceTransaction> {
  return apiRequest<MarketplaceTransaction>(
    `/marketplace/transactions/${encodeURIComponent(transactionId)}/complete`,
    {
      method: 'PATCH',
    },
  );
}

export function cancelMarketplaceTransaction(
  transactionId: string,
): Promise<MarketplaceTransaction> {
  return apiRequest<MarketplaceTransaction>(
    `/marketplace/transactions/${encodeURIComponent(transactionId)}/cancel`,
    {
      method: 'PATCH',
    },
  );
}

export function getMarketplaceTransactions(): Promise<MarketplaceTransaction[]> {
  return apiRequest<MarketplaceTransaction[]>('/marketplace/transactions');
}

export function updateMarketplaceTransactionStatus(
  transactionId: string,
  status: 'COLLECTION_PENDING' | 'DELIVERY_PENDING',
): Promise<MarketplaceTransaction> {
  return apiRequest<MarketplaceTransaction>(
    `/marketplace/transactions/${encodeURIComponent(transactionId)}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        status,
      }),
    },
  );
}

export function processExpiredMarketplaceTransactions(): Promise<{
  processed: boolean;
}> {
  return apiRequest<{
    processed: boolean;
  }>('/marketplace/transactions/process-expired', {
    method: 'POST',
  });
}
