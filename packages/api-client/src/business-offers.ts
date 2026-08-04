import { apiRequest } from './client';

export interface BusinessOffer {
  id: string;

  businessId: string;

  title: string;

  description: string;

  active: boolean;

  startsAt: string | null;

  endsAt: string | null;

  createdAt: string;
}

export function createBusinessOffer(
  businessId: string,
  data: {
    title: string;
    description: string;
    active?: boolean;
    startsAt?: string;
    endsAt?: string;
  },
) {
  return apiRequest<BusinessOffer>(`/businesses/${businessId}/offers`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getBusinessOffers(businessId: string) {
  return apiRequest<BusinessOffer[]>(`/businesses/${businessId}/offers`);
}

export function getBusinessOffer(id: string) {
  return apiRequest<BusinessOffer>(`/businesses/offers/${id}`);
}

export function getDiscoverOffers() {
  return apiRequest<BusinessOffer[]>('/businesses/offers/discover');
}
