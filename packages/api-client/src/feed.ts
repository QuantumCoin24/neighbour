import { apiRequest } from './index';

export interface Post {
  id: string;
  title: string | null;
  content: string;
  status: string;
  visibility: string;
  publishedAt: string | null;
  createdAt: string;
  author: {
    id: string;
    displayName: string;
    username: string | null;
    avatarUrl: string | null;
  };
  community: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface FeedResponse {
  items: Post[];
  nextCursor: string | null;
}

export function getCommunityFeed(token: string, slug: string) {
  return apiRequest<FeedResponse>(`/communities/${slug}/feed`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
