import type { SearchResponse } from '@neighbour/api-client';

export type SearchCategory =
  'all' | 'people' | 'communities' | 'neighbourhoods' | 'events' | 'posts';

export interface SearchCategoryDefinition {
  id: SearchCategory;
  label: string;
  symbol: string;
}

export interface SearchResultCounts {
  all: number;
  people: number;
  communities: number;
  neighbourhoods: number;
  events: number;
  posts: number;
}

export function getSearchResultCounts(results: SearchResponse): SearchResultCounts {
  const people = results.users.length;
  const communities = results.communities.length;
  const neighbourhoods = results.neighbourhoods.length;
  const events = results.events.length;
  const posts = results.posts.length;

  return {
    all: people + communities + neighbourhoods + events + posts,
    people,
    communities,
    neighbourhoods,
    events,
    posts,
  };
}
