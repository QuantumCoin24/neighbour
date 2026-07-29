export interface NotificationCreatedEvent {
  type: 'notification.created';
  id: string;
  userId: string;
  notificationType: string;
  title: string;
  message: string;
}
