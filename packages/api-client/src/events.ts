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
  community?: {
    id: string;
    name: string;
  };
  creator?: {
    id: string;
    displayName: string;
  };
  attendanceCount?: number;
}

export interface EventAttendance {
  id: string;
  eventId: string;
  userId: string;
  createdAt: string;
}

export function getCommunityEvents(communityId: string) {
  return apiRequest<EventItem[]>(`/communities/${communityId}/events`, {
    method: 'GET',
  });
}

export function getEvent(eventId: string) {
  return apiRequest<EventItem>(`/communities/events/${eventId}`, {
    method: 'GET',
  });
}

export function getEventAttendance(eventId: string) {
  return apiRequest<EventAttendance[]>(`/events/${eventId}/attendance`, {
    method: 'GET',
  });
}

export function attendEvent(token: string, eventId: string) {
  return apiRequest<EventAttendance>(`/events/${eventId}/attendance`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function leaveEvent(token: string, eventId: string) {
  return apiRequest<void>(`/events/${eventId}/attendance`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function deleteEvent(token: string, eventId: string) {
  return apiRequest<void>(`/communities/events/${encodeURIComponent(eventId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
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
  return apiRequest(`/communities/${data.communityId}/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: data.title,
      description: data.description,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
    }),
  });
}
