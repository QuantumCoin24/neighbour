export type NotificationStatus = 'unread' | 'read' | 'archived';

export interface NotificationEntity {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  status: NotificationStatus;
  createdAt: Date;
  readAt?: Date;
  metadata?: Record<string, unknown>;
}
