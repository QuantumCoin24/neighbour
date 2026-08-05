import { apiRequest } from './client';

export type CommunityVisibility = 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY';

export type CommunityCategory =
  | 'LOCAL_AREA'
  | 'STREET'
  | 'ESTATE'
  | 'VILLAGE'
  | 'TOWN'
  | 'CITY'
  | 'SCHOOL'
  | 'PARENTS'
  | 'SPORTS'
  | 'CHARITY'
  | 'BUSINESS_NETWORK'
  | 'HOBBY'
  | 'FAITH'
  | 'OTHER';

export type CommunityJoinPolicy = 'OPEN' | 'APPROVAL' | 'INVITE_ONLY';

export type CommunityMembershipRole = 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER';

export type CommunityMembershipStatus = 'ACTIVE' | 'INVITED' | 'LEFT' | 'BLOCKED';

export type LocationVisibility = 'PUBLIC' | 'COMMUNITY' | 'PRIVATE';

export interface Community {
  id: string;
  name: string;
  slug: string;
  handle: string;
  shortDescription: string | null;
  description: string | null;
  category: CommunityCategory;
  tags: string[];
  welcomeMessage: string | null;
  rules: string[];
  logoUrl: string | null;
  bannerUrl: string | null;
  accentColour: string | null;
  visibility: CommunityVisibility;
  joinPolicy: CommunityJoinPolicy;
  approvalRequired: boolean;
  allowMemberPosts: boolean;
  allowBusinesses: boolean;
  allowMarketplace: boolean;
  allowEvents: boolean;
  discoverable: boolean;
  latitude: number | null;
  longitude: number | null;
  locationAccuracyM: number | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postcode: string | null;
  locationVisibility: LocationVisibility;
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
  handle?: string;
  shortDescription?: string;
  description?: string;
  category?: CommunityCategory;
  tags?: string[];
  welcomeMessage?: string;
  rules?: string[];
  visibility?: CommunityVisibility;
  joinPolicy?: CommunityJoinPolicy;
  approvalRequired?: boolean;
  allowMemberPosts?: boolean;
  allowBusinesses?: boolean;
  allowMarketplace?: boolean;
  allowEvents?: boolean;
  discoverable?: boolean;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postcode?: string;
  latitude?: number;
  longitude?: number;
  locationAccuracyM?: number;
  locationVisibility?: LocationVisibility;
  logoUrl?: string;
  bannerUrl?: string;
  accentColour?: string;
}

export interface CommunitySearchRequest {
  q?: string;
  category?: CommunityCategory;
  postcode?: string;
  city?: string;
  limit?: number;
}

function tokenHeaders(token?: string): HeadersInit | undefined {
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : undefined;
}

function buildSearchParams(query: CommunitySearchRequest): string {
  const params = new URLSearchParams();

  if (query.q?.trim()) {
    params.set('q', query.q.trim());
  }

  if (query.category) {
    params.set('category', query.category);
  }

  if (query.postcode?.trim()) {
    params.set('postcode', query.postcode.trim());
  }

  if (query.city?.trim()) {
    params.set('city', query.city.trim());
  }

  if (query.limit) {
    params.set('limit', String(query.limit));
  }

  const output = params.toString();

  return output ? `?${output}` : '';
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

export function getCommunities(query: CommunitySearchRequest = {}): Promise<Community[]> {
  return apiRequest<Community[]>(`/communities${buildSearchParams(query)}`);
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

export function leaveCommunity(slug: string): Promise<{
  left: true;
  communityId: string;
}> {
  return apiRequest(`/communities/${encodeURIComponent(slug)}/leave`, {
    method: 'DELETE',
  });
}
