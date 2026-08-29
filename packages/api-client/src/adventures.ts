import { apiRequest } from './client';

export type AdventureScope = 'PERSONAL' | 'COMMUNITY';

export type AdventureCategory =
  | 'FAMILY'
  | 'NATURE'
  | 'HISTORY'
  | 'PHOTOGRAPHY'
  | 'FITNESS'
  | 'EXPLORATION'
  | 'FOOD'
  | 'COMMUNITY'
  | 'SEASONAL'
  | 'OTHER';

export type AdventureStageType =
  'CHECKPOINT' | 'TASK' | 'CLUE' | 'ACTIVITY' | 'PHOTO' | 'INFORMATION';

export type AdventureVisibility = 'PRIVATE' | 'COMMUNITY' | 'PUBLIC';

export interface AdventureStage {
  id: string;
  adventureId: string;
  position: number;
  type: AdventureStageType;
  title: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Adventure {
  id: string;
  creatorId: string;
  communityId: string | null;
  trailId: string | null;
  scope: AdventureScope;
  category: AdventureCategory;
  title: string;
  description: string;
  visibility: AdventureVisibility;
  estimatedMinutes: number | null;
  startsAt: string | null;
  expiresAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  stages: AdventureStage[];
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
  trail?: {
    id: string;
    creatorId: string;
    communityId: string | null;
    title: string;
    scope: string;
    visibility: AdventureVisibility;
  } | null;
}

export interface AdventureStageInput {
  position: number;
  type: AdventureStageType;
  title: string;
  description?: string;
  latitude?: number;
  longitude?: number;
}

export interface CreateAdventureInput {
  scope: AdventureScope;
  communityId?: string;
  trailId?: string;
  category: AdventureCategory;
  title: string;
  description: string;
  visibility: AdventureVisibility;
  estimatedMinutes?: number;
  startsAt?: string;
  expiresAt?: string;
  stages: AdventureStageInput[];
}

export interface UpdateAdventureInput {
  trailId?: string;
  category?: AdventureCategory;
  title?: string;
  description?: string;
  visibility?: AdventureVisibility;
  estimatedMinutes?: number;
  startsAt?: string;
  expiresAt?: string;
  stages?: AdventureStageInput[];
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export function createAdventure(token: string, input: CreateAdventureInput) {
  return apiRequest<Adventure>('/adventures', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
}

export function getMyAdventures(token: string) {
  return apiRequest<Adventure[]>('/adventures/mine', {
    method: 'GET',
    headers: authHeaders(token),
  });
}

export function getPublicProfileAdventures(username: string) {
  return apiRequest<Adventure[]>(`/adventures/profile/${encodeURIComponent(username)}`, {
    method: 'GET',
  });
}

export function getCommunityAdventures(token: string, communityId: string) {
  return apiRequest<Adventure[]>(`/adventures/community/${encodeURIComponent(communityId)}`, {
    method: 'GET',
    headers: authHeaders(token),
  });
}

export function updateAdventure(token: string, adventureId: string, input: UpdateAdventureInput) {
  return apiRequest<Adventure>(`/adventures/${encodeURIComponent(adventureId)}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
}

export function removeAdventure(token: string, adventureId: string) {
  return apiRequest<{ success: boolean }>(`/adventures/${encodeURIComponent(adventureId)}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}

export interface AdventureProgress {
  id: string;
  adventureId: string;
  userId: string;
  currentStagePosition: number;
  completedStages: number[];
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function startAdventure(token: string, adventureId: string) {
  return apiRequest<AdventureProgress>(
    `/adventures/${encodeURIComponent(adventureId)}/progress/start`,
    {
      method: 'POST',
      headers: authHeaders(token),
    },
  );
}

export function getAdventureProgress(token: string, adventureId: string) {
  return apiRequest<AdventureProgress | null>(
    `/adventures/${encodeURIComponent(adventureId)}/progress`,
    {
      method: 'GET',
      headers: authHeaders(token),
    },
  );
}

export function completeAdventureStage(token: string, adventureId: string, position: number) {
  return apiRequest<AdventureProgress>(
    `/adventures/${encodeURIComponent(adventureId)}/progress/stages/${position}`,
    {
      method: 'PATCH',
      headers: authHeaders(token),
    },
  );
}
