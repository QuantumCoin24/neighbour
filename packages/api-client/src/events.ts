import { apiRequest } from './index';

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
  return apiRequest<EventItem[]>(`/events/community/${communityId}`, {
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
  return apiRequest<EventItem>('/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}
