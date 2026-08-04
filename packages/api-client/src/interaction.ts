import { apiRequest } from './index';

export interface ReactionSummary {
  counts: {
    type: string;
    count: number;
  }[];
  total: number;
  viewerReaction: string | null;
}

export interface Comment {
  id: string;
  postId: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    displayName: string;
    username: string | null;
    avatarUrl: string | null;
  };
}

export function setReaction(token: string, postId: string, type: string) {
  return apiRequest(`/posts/${postId}/reaction`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      type,
    }),
  });
}

export function removeReaction(token: string, postId: string) {
  return apiRequest(`/posts/${postId}/reaction`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getReactionSummary(token: string, postId: string) {
  return apiRequest<ReactionSummary>(`/posts/${postId}/reactions`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getComments(token: string, postId: string) {
  return apiRequest<{ items: Comment[] }>(
    `/posts/${postId}/comments`,

    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export function createComment(token: string, postId: string, content: string) {
  return apiRequest<Comment>(
    `/posts/${postId}/comments`,

    {
      method: 'POST',

      headers: {
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        content,
      }),
    },
  );
}
