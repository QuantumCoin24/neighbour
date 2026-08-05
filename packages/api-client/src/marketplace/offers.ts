import { apiRequest } from '../client';

import type { CreateMarketplaceOfferRequest, MarketplaceOffer } from './types';

export function getBusinessOffers(businessId: string): Promise<MarketplaceOffer[]> {
  return apiRequest<MarketplaceOffer[]>(`/businesses/${encodeURIComponent(businessId)}/offers`);
}

export function getMarketplaceOffer(offerId: string): Promise<MarketplaceOffer> {
  return apiRequest<MarketplaceOffer>(`/businesses/offers/${encodeURIComponent(offerId)}`);
}

export function createMarketplaceOffer(
  businessId: string,
  data: CreateMarketplaceOfferRequest,
): Promise<MarketplaceOffer> {
  return apiRequest<MarketplaceOffer>(`/businesses/${encodeURIComponent(businessId)}/offers`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
