export type VibeStatus =
  | 'DRAFT'
  | 'PROCESSING'
  | 'PUBLISHED'
  | 'HIDDEN'
  | 'REMOVED'
  | 'FAILED';

export type VibeVisibility =
  | 'PUBLIC'
  | 'COMMUNITY'
  | 'NEIGHBOURHOOD';

export type VibeReactionType =
  | 'LIKE'
  | 'LOVE'
  | 'FIRE'
  | 'LAUGH'
  | 'WOW';

export interface VibeCreator {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface VibeMedia {
  id: string;
  mediaId: string;
  position: number;
  publicUrl: string | null;
  mimeType: string;
  width: number | null;
  height: number | null;
  durationMs: number | null;
}

export interface VibeEngagement {
  reactionCount: number;
  commentCount: number;
  saveCount: number;
  shareCount: number;
  viewCount: number;
  totalWatchTimeMs: number;
  myReaction: VibeReactionType | null;
  savedByMe: boolean;
}

export interface Vibe {
  id: string;
  creatorId: string;
  communityId: string | null;
  neighbourhoodId: string | null;
  caption: string | null;
  status: VibeStatus;
  visibility: VibeVisibility;
  latitude: number | null;
  longitude: number | null;
  locationAccuracyM: number | null;
  postcode: string | null;
  publishedAt: string | null;
  editedAt: string | null;
  createdAt: string;
  updatedAt: string;
  creator: VibeCreator;
  media: VibeMedia[];
  engagement: VibeEngagement;
}

export interface VibeFeed {
  items: Vibe[];
  nextCursor: string | null;
}

export interface VibeComment {
  id: string;
  vibeId: string;
  authorId: string;
  parentId: string | null;
  content: string;
  editedAt: string | null;
  createdAt: string;
  author: VibeCreator;
}

export interface CreateVibeInput {
  caption?: string;
  status?: VibeStatus;
  visibility?: VibeVisibility;
  communityId?: string;
  neighbourhoodId?: string;
  latitude?: number;
  longitude?: number;
  locationAccuracyM?: number;
  postcode?: string;
  mediaIds?: string[];
}

export interface UpdateVibeInput
  extends Partial<CreateVibeInput> {}

export interface VibeFeedQuery {
  cursor?: string;
  limit?: number;
  communityId?: string;
  neighbourhoodId?: string;
}

export interface CreateVibeCommentInput {
  content: string;
  parentId?: string;
}

export interface RecordVibeViewInput {
  sessionKey?: string;
  watchTimeMs: number;
  completionRatio?: number;
  completed?: boolean;
  replay?: boolean;
}
