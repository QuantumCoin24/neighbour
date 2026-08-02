export type PostStatusResponse = 'DRAFT' | 'PUBLISHED';

export type PostVisibilityResponse = 'PUBLIC' | 'CONNECTIONS' | 'COMMUNITY' | 'PRIVATE';

export interface PostAuthorResponse {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  localArea: string | null;
}

export interface PostCommunityResponse {
  id: string;
  name: string;
  slug: string;
}

export interface PostNeighbourhoodResponse {
  id: string;
  name: string;
  localArea: string | null;
}

export interface PostResponse {
  id: string;
  title: string | null;
  content: string;
  status: PostStatusResponse;
  visibility: PostVisibilityResponse;
  author: PostAuthorResponse;
  community: PostCommunityResponse | null;
  neighbourhood: PostNeighbourhoodResponse | null;
  publishedAt: Date | null;
  editedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeedResponse {
  items: PostResponse[];
  nextCursor: string | null;
}
