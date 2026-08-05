import { apiRequest } from '../client';

import type { CreateMarketplaceBusinessEventRequest, MarketplaceBusinessEvent } from './types';

export function getBusinessMarketplaceEvents(
  businessId: string,
): Promise<MarketplaceBusinessEvent[]> {
  return apiRequest<MarketplaceBusinessEvent[]>(
    `/businesses/${encodeURIComponent(businessId)}/events`,
  );
}

export function getMarketplaceBusinessEvent(eventId: string): Promise<MarketplaceBusinessEvent> {
  return apiRequest<MarketplaceBusinessEvent>(`/businesses/events/${encodeURIComponent(eventId)}`);
}

export function createMarketplaceBusinessEvent(
  businessId: string,
  data: CreateMarketplaceBusinessEventRequest,
): Promise<MarketplaceBusinessEvent> {
  return apiRequest<MarketplaceBusinessEvent>(
    `/businesses/${encodeURIComponent(businessId)}/events`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  );
}
