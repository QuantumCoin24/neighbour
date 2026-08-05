import { apiRequest } from '../client';

import type { CreateMarketplaceBusinessRequest, MarketplaceBusiness } from './types';

export function createMarketplaceBusiness(
  data: CreateMarketplaceBusinessRequest,
): Promise<MarketplaceBusiness> {
  return apiRequest<MarketplaceBusiness>('/businesses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getMyMarketplaceBusiness(): Promise<MarketplaceBusiness | null> {
  return apiRequest<MarketplaceBusiness | null>('/businesses/me');
}

export function getCommunityMarketplaceBusinesses(
  communityId: string,
): Promise<MarketplaceBusiness[]> {
  return apiRequest<MarketplaceBusiness[]>(
    `/businesses/community/${encodeURIComponent(communityId)}`,
  );
}

export function searchMarketplaceBusinesses(query: string): Promise<MarketplaceBusiness[]> {
  return apiRequest<MarketplaceBusiness[]>(`/businesses/search?q=${encodeURIComponent(query)}`);
}
