import { apiRequest } from '../../client';

import type {
  CreateMarketplaceListingInput,
  MarketplaceListing,
  MarketplaceListingPage,
  SearchMarketplaceListingInput,
  UpdateMarketplaceListingInput,
} from './types';

function buildQuery(input: SearchMarketplaceListingInput): string {
  const parameters = new URLSearchParams();

  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined && value !== null && value !== '') {
      parameters.set(key, String(value));
    }
  }

  const query = parameters.toString();

  return query ? `?${query}` : '';
}

export function createMarketplaceListing(
  input: CreateMarketplaceListingInput,
): Promise<MarketplaceListing> {
  return apiRequest<MarketplaceListing>('/marketplace/listings', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function searchMarketplaceListings(
  input: SearchMarketplaceListingInput = {},
): Promise<MarketplaceListingPage> {
  return apiRequest<MarketplaceListingPage>(`/marketplace/listings${buildQuery(input)}`);
}

export function getMarketplaceListing(listingId: string): Promise<MarketplaceListing> {
  return apiRequest<MarketplaceListing>(`/marketplace/listings/${encodeURIComponent(listingId)}`);
}

export function getSavedMarketplaceListings(): Promise<MarketplaceListing[]> {
  return apiRequest<MarketplaceListing[]>('/marketplace/listings/saved');
}

export function getMyMarketplaceListings(): Promise<MarketplaceListing[]> {
  return apiRequest<MarketplaceListing[]>('/marketplace/listings/mine');
}

export function updateMarketplaceListing(
  listingId: string,
  input: UpdateMarketplaceListingInput,
): Promise<MarketplaceListing> {
  return apiRequest<MarketplaceListing>(`/marketplace/listings/${encodeURIComponent(listingId)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function toggleMarketplaceListingSaved(listingId: string): Promise<{
  saved: boolean;
  savedCount: number;
}> {
  return apiRequest<{
    saved: boolean;
    savedCount: number;
  }>(`/marketplace/listings/${encodeURIComponent(listingId)}/saved`, {
    method: 'POST',
  });
}

export function deleteMarketplaceListing(listingId: string): Promise<void> {
  return apiRequest<void>(`/marketplace/listings/${encodeURIComponent(listingId)}`, {
    method: 'DELETE',
  });
}
