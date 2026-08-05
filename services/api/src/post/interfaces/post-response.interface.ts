export type PostStatusResponse = 'DRAFT' | 'PUBLISHED';

export type PostVisibilityResponse = 'PUBLIC' | 'CONNECTIONS' | 'COMMUNITY' | 'PRIVATE';

export type PostTypeResponse =
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
  type: PostTypeResponse;
  isPinned: boolean;
  metadata: Record<string, unknown> | null;
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
