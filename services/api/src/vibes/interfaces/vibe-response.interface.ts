import type {
  VibeReactionType,
  VibeStatus,
  VibeVisibility,
} from '../../generated/prisma/client';

export interface VibeCreatorResponse {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface VibeMediaResponse {
  id: string;
  mediaId: string;
  position: number;
  publicUrl: string | null;
  mimeType: string;
  width: number | null;
  height: number | null;
  durationMs: number | null;
}

export interface VibeEngagementResponse {
  reactionCount: number;
  commentCount: number;
  saveCount: number;
  shareCount: number;
  viewCount: number;
  totalWatchTimeMs: number;
  myReaction: VibeReactionType | null;
  savedByMe: boolean;
}

export interface VibeResponse {
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
  creator: VibeCreatorResponse;
  media: VibeMediaResponse[];
  engagement: VibeEngagementResponse;
}

export interface VibeFeedResponse {
  items: VibeResponse[];
  nextCursor: string | null;
}

export interface VibeCommentResponse {
  id: string;
  vibeId: string;
  authorId: string;
  parentId: string | null;
  content: string;
  editedAt: string | null;
  createdAt: string;
  author: VibeCreatorResponse;
}

export interface VibeSaveResponse {
  saved: boolean;
}

export interface VibeViewReceiptResponse {
  id: string;
  recorded: true;
}
