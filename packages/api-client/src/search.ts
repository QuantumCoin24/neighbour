import { apiRequest } from './client';

export interface SearchUserResult {
  id: string;
  displayName: string;
}

export interface SearchCommunityResult {
  id: string;
  name: string;
  slug: string;
}

export interface SearchNeighbourhoodResult {
  id: string;
  name: string;
  localArea: string | null;
}

export interface SearchEventResult {
  id: string;
  title: string;
  startsAt: string;
  community: {
    name: string;
  } | null;
}

export interface SearchPostResult {
  id: string;
  title: string | null;
  content: string;
}

export interface SearchResponse {
  users: SearchUserResult[];
  communities: SearchCommunityResult[];
  neighbourhoods: SearchNeighbourhoodResult[];
  events: SearchEventResult[];
  posts: SearchPostResult[];
}

export const EMPTY_SEARCH_RESPONSE: SearchResponse = {
  users: [],
  communities: [],
  neighbourhoods: [],
  events: [],
  posts: [],
};

export function search(query: string): Promise<SearchResponse> {
  const value = query.trim();

  if (!value) {
    return Promise.resolve(EMPTY_SEARCH_RESPONSE);
  }

  return apiRequest<SearchResponse>(`/search?q=${encodeURIComponent(value)}`, {
    method: 'GET',
  });
}
