import { apiRequest } from './client';
import type { FeedPost } from './feed';

export type PostType =
  | 'STANDARD'
  | 'ANNOUNCEMENT'
  | 'QUESTION'
  | 'RECOMMENDATION'
  | 'HELP_REQUEST'
  | 'LOST_FOUND'
  | 'SAFETY_ALERT'
  | 'ROAD_CLOSURE'
  | 'LOCAL_UPDATE'
  | 'POLL'
  | 'EVENT_SHARE'
  | 'MARKETPLACE_SHARE'
  | 'BUSINESS_UPDATE'
  | 'VOLUNTEER_REQUEST';

export interface CreatePostInput {
  title?: string;
  content: string;
  type?: PostType;
  communityId?: string;
  neighbourhoodId?: string;
  status?: 'DRAFT' | 'PUBLISHED';
  visibility?: 'PUBLIC' | 'CONNECTIONS' | 'COMMUNITY' | 'PRIVATE';
  isPinned?: boolean;
  metadata?: Record<string, unknown>;
}

export interface UpdatePostInput {
  title?: string | null;
  content?: string;
  type?: PostType;
  communityId?: string | null;
  status?: 'DRAFT' | 'PUBLISHED';
  visibility?: 'PUBLIC' | 'CONNECTIONS' | 'COMMUNITY' | 'PRIVATE';
  isPinned?: boolean;
  metadata?: Record<string, unknown> | null;
}

function tokenHeaders(token?: string): HeadersInit | undefined {
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : undefined;
}

export function createPost(data: CreatePostInput): Promise<FeedPost>;

export function createPost(token: string, data: CreatePostInput): Promise<FeedPost>;

export function createPost(
  first: string | CreatePostInput,
  second?: CreatePostInput,
): Promise<FeedPost> {
  const legacyCall = typeof first === 'string';
  const token = legacyCall ? first : undefined;
  const data = legacyCall ? second : first;

  if (!data) {
    throw new Error('Post creation data is required.');
  }

  return apiRequest<FeedPost>('/posts', {
    method: 'POST',
    headers: tokenHeaders(token),
    body: JSON.stringify(data),
  });
}

export function updatePost(postId: string, data: UpdatePostInput): Promise<FeedPost> {
  return apiRequest<FeedPost>(`/posts/${encodeURIComponent(postId)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deletePost(postId: string): Promise<void> {
  return apiRequest<void>(`/posts/${encodeURIComponent(postId)}`, {
    method: 'DELETE',
  });
}

export function getPostsByProfile(username: string) {
  return apiRequest<{
    items: FeedPost[];
  }>(`/profiles/${encodeURIComponent(username)}/posts`);
}
