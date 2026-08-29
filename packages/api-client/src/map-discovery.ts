import { apiRequest } from './client';

export type MapDiscoveryScope = 'PERSONAL' | 'COMMUNITY';
export type MapDiscoveryType = 'MOMENT' | 'SEASONAL' | 'LANDMARK';

export type MapDiscoveryCategory =
  | 'NATURE'
  | 'WALK'
  | 'ACTIVITY'
  | 'VIEWPOINT'
  | 'LOCAL_HISTORY'
  | 'ART_CULTURE'
  | 'COMMUNITY'
  | 'OTHER';

export type MapDiscoveryVisibility = 'PUBLIC' | 'COMMUNITY' | 'PRIVATE';

export interface MapDiscovery {
  id: string;
  creatorId: string;
  communityId: string | null;
  scope: MapDiscoveryScope;
  type: MapDiscoveryType;
  category: MapDiscoveryCategory;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  locationAccuracyM: number | null;
  visibility: MapDiscoveryVisibility;
  startsAt: string | null;
  expiresAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
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

export interface CreateMapDiscoveryRequest {
  scope: MapDiscoveryScope;
  type: MapDiscoveryType;
  category?: MapDiscoveryCategory;
  communityId?: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  locationAccuracyM?: number;
  visibility?: MapDiscoveryVisibility;
  startsAt?: string;
  expiresAt?: string;
}

export interface UpdateMapDiscoveryRequest {
  type?: MapDiscoveryType;
  category?: MapDiscoveryCategory;
  title?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  locationAccuracyM?: number;
  visibility?: MapDiscoveryVisibility;
  startsAt?: string | null;
  expiresAt?: string | null;
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export function createMapDiscovery(
  token: string,
  data: CreateMapDiscoveryRequest,
) {
  return apiRequest<MapDiscovery>('/map-discoveries', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export function updateMapDiscovery(
  token: string,
  id: string,
  data: UpdateMapDiscoveryRequest,
) {
  return apiRequest<MapDiscovery>(
    `/map-discoveries/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify(data),
    },
  );
}

export function getMyMapDiscoveries(token: string) {
  return apiRequest<MapDiscovery[]>('/map-discoveries/mine', {
    method: 'GET',
    headers: authHeaders(token),
  });
}

export function getPublicProfileMapDiscoveries(username: string) {
  return apiRequest<MapDiscovery[]>(
    `/map-discoveries/profile/${encodeURIComponent(username)}`,
    {
      method: 'GET',
    },
  );
}

export function getCommunityMapDiscoveries(
  token: string,
  communityId: string,
) {
  return apiRequest<MapDiscovery[]>(
    `/map-discoveries/community/${encodeURIComponent(communityId)}`,
    {
      method: 'GET',
      headers: authHeaders(token),
    },
  );
}

export function deleteMapDiscovery(token: string, id: string) {
  return apiRequest<void>(
    `/map-discoveries/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      headers: authHeaders(token),
    },
  );
}
