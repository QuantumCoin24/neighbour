import type { NotificationEntity } from './notification.entity';

export abstract class NotificationRepository {
  abstract save(notification: NotificationEntity): Promise<NotificationEntity>;

  abstract findByUser(userId: string): Promise<NotificationEntity[]>;

  abstract markRead(id: string): Promise<NotificationEntity | undefined>;

  abstract markAllRead(userId: string): Promise<void>;
}
