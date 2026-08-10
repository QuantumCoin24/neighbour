import { apiRequest } from './client';

export interface EventItem {
  id: string;
  communityId: string;
  creatorId: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  createdAt: string;
}

export function getCommunityEvents(communityId: string) {
  return apiRequest<EventItem[]>(`/communities/${communityId}/events`, {
    method: 'GET',
  });
}

export function createEvent(
  token: string,
  data: {
    communityId: string;
    title: string;
    description: string;
    startsAt: string;
    endsAt: string;
  },
) {
  return apiRequest<EventItem>(`/communities/${data.communityId}/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}
