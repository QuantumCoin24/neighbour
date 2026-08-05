import { apiRequest } from './client';

export type NotificationType =
  | 'COMMENT'
  | 'REPLY'
  | 'REACTION'
  | 'MESSAGE'
  | 'CONNECTION'
  | 'COMMUNITY_INVITE'
  | 'COMMUNITY_UPDATE'
  | string;

export interface NotificationActor {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
}

export interface Notification {
  id: string;
  type: NotificationType;
  actor: NotificationActor | null;
  postId: string | null;
  commentId: string | null;
  communityId: string | null;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationFeed {
  items: Notification[];
  nextCursor: string | null;
  unreadCount: number;
}

export interface NotificationQuery {
  cursor?: string;
  limit?: number;
  unreadOnly?: boolean;
}

function tokenHeaders(token?: string): HeadersInit | undefined {
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : undefined;
}

function buildNotificationQuery(query: NotificationQuery = {}): string {
  const parameters = new URLSearchParams();

  if (query.cursor) {
    parameters.set('cursor', query.cursor);
  }

  if (query.limit) {
    parameters.set('limit', String(query.limit));
  }

  if (query.unreadOnly) {
    parameters.set('unreadOnly', 'true');
  }

  const value = parameters.toString();

  return value ? `?${value}` : '';
}

export function getNotifications(query?: NotificationQuery): Promise<NotificationFeed>;

export function getNotifications(
  token: string,
  query?: NotificationQuery,
): Promise<NotificationFeed>;

export function getNotifications(
  first: string | NotificationQuery = {},
  second: NotificationQuery = {},
): Promise<NotificationFeed> {
  const legacyCall = typeof first === 'string';

  const token = legacyCall ? first : undefined;
  const query = legacyCall ? second : first;

  return apiRequest<NotificationFeed>(`/notifications${buildNotificationQuery(query)}`, {
    headers: tokenHeaders(token),
  });
}

export function getUnreadNotificationCount(): Promise<{
  unreadCount: number;
}>;

export function getUnreadNotificationCount(token: string): Promise<{
  unreadCount: number;
}>;

export function getUnreadNotificationCount(token?: string): Promise<{
  unreadCount: number;
}> {
  return apiRequest<{
    unreadCount: number;
  }>('/notifications/unread-count', {
    headers: tokenHeaders(token),
  });
}

export function markNotificationRead(notificationId: string): Promise<Notification>;

export function markNotificationRead(token: string, notificationId: string): Promise<Notification>;

export function markNotificationRead(first: string, second?: string): Promise<Notification> {
  const legacyCall = second !== undefined;

  const token = legacyCall ? first : undefined;
  const notificationId = legacyCall ? second : first;

  return apiRequest<Notification>(`/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: 'PATCH',
    headers: tokenHeaders(token),
  });
}

export function markAllNotificationsRead(): Promise<{
  updatedCount: number;
}>;

export function markAllNotificationsRead(token: string): Promise<{
  updatedCount: number;
}>;

export function markAllNotificationsRead(token?: string): Promise<{
  updatedCount: number;
}> {
  return apiRequest<{
    updatedCount: number;
  }>('/notifications/read-all', {
    method: 'PATCH',
    headers: tokenHeaders(token),
  });
}

export function dismissNotification(notificationId: string): Promise<void>;

export function dismissNotification(token: string, notificationId: string): Promise<void>;

export function dismissNotification(first: string, second?: string): Promise<void> {
  const legacyCall = second !== undefined;

  const token = legacyCall ? first : undefined;
  const notificationId = legacyCall ? second : first;

  return apiRequest<void>(`/notifications/${encodeURIComponent(notificationId)}`, {
    method: 'DELETE',
    headers: tokenHeaders(token),
  });
}
