import { apiRequest } from './client';

export interface Business {
  id: string;

  communityId: string;

  ownerId: string;

  name: string;

  description: string;

  category: string;

  verified: boolean;

  createdAt: string;
}

export function createBusiness(data: {
  communityId: string;
  name: string;
  description: string;
  category: string;
}) {
  return apiRequest<Business>('/businesses', {
    method: 'POST',

    body: JSON.stringify(data),
  });
}

export function getCommunityBusinesses(communityId: string) {
  return apiRequest<Business[]>(`/businesses/community/${communityId}`);
}

export function searchBusinesses(query: string) {
  return apiRequest<Business[]>(`/businesses/search?q=${encodeURIComponent(query)}`);
}
