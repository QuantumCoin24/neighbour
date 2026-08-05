import { apiRequest } from './client';

export type CommunityVisibility = 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY';

export type CommunityMembershipRole = 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER';

export type CommunityMembershipStatus = 'ACTIVE' | 'INVITED' | 'LEFT' | 'BLOCKED';

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: CommunityVisibility;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityMembership {
  id: string;
  role: CommunityMembershipRole;
  status: CommunityMembershipStatus;
  joinedAt: string;
  updatedAt: string;
  community: Community;
}

export interface CreateCommunityRequest {
  name: string;
  description?: string;
  visibility?: CommunityVisibility;
}

function tokenHeaders(token?: string): HeadersInit | undefined {
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : undefined;
}

export function createCommunity(data: CreateCommunityRequest): Promise<Community>;

export function createCommunity(token: string, data: CreateCommunityRequest): Promise<Community>;

export function createCommunity(
  first: string | CreateCommunityRequest,
  second?: CreateCommunityRequest,
): Promise<Community> {
  const legacyCall = typeof first === 'string';
  const token = legacyCall ? first : undefined;
  const data = legacyCall ? second : first;

  if (!data) {
    throw new Error('Community creation data is required.');
  }

  return apiRequest<Community>('/communities', {
    method: 'POST',
    headers: tokenHeaders(token),
    body: JSON.stringify(data),
  });
}

export function getCommunities(): Promise<Community[]> {
  return apiRequest<Community[]>('/communities');
}

export function getCommunity(slug: string): Promise<Community>;

export function getCommunity(token: string, slug: string): Promise<Community>;

export function getCommunity(first: string, second?: string): Promise<Community> {
  const legacyCall = typeof second === 'string';
  const token = legacyCall ? first : undefined;
  const slug = legacyCall ? second : first;

  return apiRequest<Community>(`/communities/${encodeURIComponent(slug)}`, {
    headers: tokenHeaders(token),
  });
}

export function getPublicCommunity(slug: string): Promise<Community> {
  return getCommunity(slug);
}

export function getMyCommunities(): Promise<CommunityMembership[]>;

export function getMyCommunities(token: string): Promise<CommunityMembership[]>;

export function getMyCommunities(token?: string): Promise<CommunityMembership[]> {
  return apiRequest<CommunityMembership[]>('/communities/mine', {
    headers: tokenHeaders(token),
  });
}

export function joinCommunity(slug: string): Promise<CommunityMembership>;

export function joinCommunity(token: string, slug: string): Promise<CommunityMembership>;

export function joinCommunity(first: string, second?: string): Promise<CommunityMembership> {
  const legacyCall = typeof second === 'string';
  const token = legacyCall ? first : undefined;
  const slug = legacyCall ? second : first;

  return apiRequest<CommunityMembership>(`/communities/${encodeURIComponent(slug)}/join`, {
    method: 'POST',
    headers: tokenHeaders(token),
  });
}
