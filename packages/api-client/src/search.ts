import { apiRequest } from './client';

export interface SearchResult {
  id: string;
  query: string;
  category: 'user' | 'community' | 'business' | 'event' | 'service';
  targetId: string;
  createdAt: string;
}

export function search(query: string) {
  return apiRequest<SearchResult[]>(`/search?q=${encodeURIComponent(query)}`, {
    method: 'GET',
  });
}
