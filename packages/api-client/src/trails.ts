import { apiRequest } from './client';

export type TrailScope = 'PERSONAL' | 'COMMUNITY';

export type TrailCategory =
  | 'WALKING'
  | 'RUNNING'
  | 'CYCLING'
  | 'FAMILY'
  | 'NATURE'
  | 'HISTORY'
  | 'PHOTOGRAPHY'
  | 'FOOD'
  | 'DOG_WALKING'
  | 'ACCESSIBLE'
  | 'COMMUNITY'
  | 'OTHER';

export type TrailVisibility = 'PRIVATE' | 'COMMUNITY' | 'PUBLIC';

export interface TrailCheckpoint {
  id: string;
  trailId: string;
  mapDiscoveryId: string | null;
  position: number;
  title: string | null;
  instruction: string | null;
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt: string;
}

export interface Trail {
  id: string;
  creatorId: string;
  communityId: string | null;
  scope: TrailScope;
  category: TrailCategory;
  title: string;
  description: string;
  visibility: TrailVisibility;
  distanceM: number | null;
  estimatedMinutes: number | null;
  startsAt: string | null;
  expiresAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  checkpoints: TrailCheckpoint[];
  creator?: {
    id: string;
    displayName: string;
    username?: string | null;
  };
  community?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface TrailCheckpointInput {
  mapDiscoveryId?: string;
  position: number;
  title?: string;
  instruction?: string;
  latitude: number;
  longitude: number;
}

export interface CreateTrailInput {
  scope: TrailScope;
  communityId?: string;
  category: TrailCategory;
  title: string;
  description: string;
  visibility: TrailVisibility;
  distanceM?: number;
  estimatedMinutes?: number;
  startsAt?: string;
  expiresAt?: string;
  checkpoints: TrailCheckpointInput[];
}

export interface UpdateTrailInput {
  category?: TrailCategory;
  title?: string;
  description?: string;
  visibility?: TrailVisibility;
  distanceM?: number;
  estimatedMinutes?: number;
  startsAt?: string;
  expiresAt?: string;
  checkpoints?: TrailCheckpointInput[];
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export function createTrail(token: string, input: CreateTrailInput) {
  return apiRequest<Trail>('/trails', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
}

export function getMyTrails(token: string) {
  return apiRequest<Trail[]>('/trails/mine', {
    method: 'GET',
    headers: authHeaders(token),
  });
}

export function getPublicProfileTrails(username: string) {
  return apiRequest<Trail[]>(`/trails/profile/${encodeURIComponent(username)}`, {
    method: 'GET',
  });
}

export function getCommunityTrails(token: string, communityId: string) {
  return apiRequest<Trail[]>(`/trails/community/${encodeURIComponent(communityId)}`, {
    method: 'GET',
    headers: authHeaders(token),
  });
}

export function updateTrail(token: string, trailId: string, input: UpdateTrailInput) {
  return apiRequest<Trail>(`/trails/${encodeURIComponent(trailId)}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
}

export function removeTrail(token: string, trailId: string) {
  return apiRequest<{ success: boolean }>(`/trails/${encodeURIComponent(trailId)}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}
