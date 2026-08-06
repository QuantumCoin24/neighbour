import type { ReactionType } from '../../generated/prisma/client';

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

export interface PostReactionCountResponse {
  type: ReactionType;
  count: number;
}

export interface PostEngagementResponse {
  commentCount: number;
  reactionCounts: PostReactionCountResponse[];
  reactionTotal: number;
  viewerReaction: ReactionType | null;
}

export interface PostMediaAssetResponse {
  id: string;
  ownerId: string;
  storageKey: string;
  url: string | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  durationMs: number | null;
  status:
    | 'PENDING'
    | 'UPLOADED'
    | 'READY'
    | 'FAILED'
    | 'DELETED';
  uploadedAt: Date | null;
  readyAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostMediaResponse {
  id: string;
  position: number;
  altText: string | null;
  asset: PostMediaAssetResponse;
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
  engagement: PostEngagementResponse;
  media: PostMediaResponse[];
  publishedAt: Date | null;
  editedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeedResponse {
  items: PostResponse[];
  nextCursor: string | null;
}
