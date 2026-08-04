import { apiRequest } from './client';

export interface FeedPost {
  id: string;
  title: string | null;
  content: string;
  status: 'DRAFT' | 'PUBLISHED';
  visibility: 'PUBLIC' | 'CONNECTIONS' | 'COMMUNITY' | 'PRIVATE';
  publishedAt: string | null;
  editedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    displayName: string;
    username: string | null;
    avatarUrl: string | null;
    localArea: string | null;
  };
  community: {
    id: string;
    name: string;
    slug: string;
  } | null;
  neighbourhood: {
    id: string;
    name: string;
    localArea: string | null;
  } | null;
}

/**
 * Backward-compatible alias used by existing web components.
 */
export type Post = FeedPost;

export interface FeedResponse {
  items: FeedPost[];
  nextCursor: string | null;
}

export interface FeedQuery {
  cursor?: string;
  limit?: number;
}

function buildFeedQuery(query: FeedQuery = {}): string {
  const parameters = new URLSearchParams();

  if (query.cursor) {
    parameters.set('cursor', query.cursor);
  }

  if (query.limit) {
    parameters.set('limit', String(query.limit));
  }

  const value = parameters.toString();

  return value ? `?${value}` : '';
}

function tokenHeaders(token?: string): HeadersInit | undefined {
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : undefined;
}

export function getHomeFeed(query: FeedQuery = {}): Promise<FeedResponse> {
  return apiRequest<FeedResponse>(`/feed${buildFeedQuery(query)}`);
}

export function getCommunityFeed(slug: string, query?: FeedQuery): Promise<FeedResponse>;

export function getCommunityFeed(
  token: string,
  slug: string,
  query?: FeedQuery,
): Promise<FeedResponse>;

export function getCommunityFeed(
  first: string,
  second: string | FeedQuery = {},
  third: FeedQuery = {},
): Promise<FeedResponse> {
  const legacyCall = typeof second === 'string';

  const token = legacyCall ? first : undefined;
  const slug = legacyCall ? second : first;
  const query = legacyCall ? third : second;

  return apiRequest<FeedResponse>(
    `/communities/${encodeURIComponent(slug)}/feed${buildFeedQuery(query)}`,
    {
      headers: tokenHeaders(token),
    },
  );
}

export function getProfileFeed(username: string, query: FeedQuery = {}): Promise<FeedResponse> {
  return apiRequest<FeedResponse>(
    `/profiles/${encodeURIComponent(username)}/posts${buildFeedQuery(query)}`,
  );
}
