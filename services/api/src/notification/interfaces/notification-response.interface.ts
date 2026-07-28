import type { NotificationType } from '../../generated/prisma/client';

export interface NotificationActorResponse {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
}

export interface NotificationResponse {
  id: string;
  type: NotificationType;
  actor: NotificationActorResponse | null;
  postId: string | null;
  commentId: string | null;
  communityId: string | null;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationFeedResponse {
  items: NotificationResponse[];
  nextCursor: string | null;
  unreadCount: number;
}
