import { apiRequest } from './client';

export type ReactionType = 'LIKE' | 'LOVE' | 'SUPPORT' | 'CELEBRATE' | 'INSIGHTFUL';

export interface ReactionSummary {
  counts: {
    type: ReactionType;
    count: number;
  }[];
  total: number;
  viewerReaction: ReactionType | null;
}

export interface ReactionResponse {
  postId: string;
  type: ReactionType;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  parentId: string | null;
  content: string;
  editedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    displayName: string;
    username: string | null;
    avatarUrl: string | null;
  };
}

export interface CommentFeedResponse {
  items: Comment[];
  nextCursor: string | null;
}

function tokenHeaders(token?: string): HeadersInit | undefined {
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : undefined;
}

export function setReaction(postId: string, type: ReactionType): Promise<ReactionResponse>;

export function setReaction(
  token: string,
  postId: string,
  type: ReactionType,
): Promise<ReactionResponse>;

export function setReaction(
  first: string,
  second: string,
  third?: ReactionType,
): Promise<ReactionResponse> {
  const legacyCall = third !== undefined;

  const token = legacyCall ? first : undefined;
  const postId = legacyCall ? second : first;
  const type = legacyCall ? third : (second as ReactionType);

  return apiRequest<ReactionResponse>(`/posts/${encodeURIComponent(postId)}/reaction`, {
    method: 'PUT',
    headers: tokenHeaders(token),
    body: JSON.stringify({
      type,
    }),
  });
}

export function removeReaction(postId: string): Promise<void>;

export function removeReaction(token: string, postId: string): Promise<void>;

export function removeReaction(first: string, second?: string): Promise<void> {
  const legacyCall = second !== undefined;

  const token = legacyCall ? first : undefined;
  const postId = legacyCall ? second : first;

  return apiRequest<void>(`/posts/${encodeURIComponent(postId)}/reaction`, {
    method: 'DELETE',
    headers: tokenHeaders(token),
  });
}

export function getReactionSummary(postId: string): Promise<ReactionSummary>;

export function getReactionSummary(token: string, postId: string): Promise<ReactionSummary>;

export function getReactionSummary(first: string, second?: string): Promise<ReactionSummary> {
  const legacyCall = second !== undefined;

  const token = legacyCall ? first : undefined;
  const postId = legacyCall ? second : first;

  return apiRequest<ReactionSummary>(`/posts/${encodeURIComponent(postId)}/reactions`, {
    headers: tokenHeaders(token),
  });
}

export function getComments(postId: string): Promise<CommentFeedResponse>;

export function getComments(token: string, postId: string): Promise<CommentFeedResponse>;

export function getComments(first: string, second?: string): Promise<CommentFeedResponse> {
  const legacyCall = second !== undefined;

  const token = legacyCall ? first : undefined;
  const postId = legacyCall ? second : first;

  return apiRequest<CommentFeedResponse>(`/posts/${encodeURIComponent(postId)}/comments`, {
    headers: tokenHeaders(token),
  });
}

export function createComment(postId: string, content: string): Promise<Comment>;

export function createComment(token: string, postId: string, content: string): Promise<Comment>;

export function createComment(first: string, second: string, third?: string): Promise<Comment> {
  const legacyCall = third !== undefined;

  const token = legacyCall ? first : undefined;
  const postId = legacyCall ? second : first;
  const content = legacyCall ? third : second;

  return apiRequest<Comment>(`/posts/${encodeURIComponent(postId)}/comments`, {
    method: 'POST',
    headers: tokenHeaders(token),
    body: JSON.stringify({
      content,
    }),
  });
}
