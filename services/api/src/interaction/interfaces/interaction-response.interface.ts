import type { ReactionType } from '../../generated/prisma/client';

export interface InteractionAuthorResponse {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
}

export interface CommentResponse {
  id: string;
  postId: string;
  parentId: string | null;
  content: string;
  author: InteractionAuthorResponse;
  editedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentFeedResponse {
  items: CommentResponse[];
  nextCursor: string | null;
}

export interface ReactionResponse {
  postId: string;
  type: ReactionType;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReactionCountResponse {
  type: ReactionType;
  count: number;
}

export interface ReactionSummaryResponse {
  counts: ReactionCountResponse[];
  total: number;
  viewerReaction: ReactionType | null;
}
