import { Injectable } from '@nestjs/common';

import type { NotificationEntity } from './notification.entity';

import { NotificationRepository } from './notification.repository';

@Injectable()
export class NotificationService {
  constructor(private readonly repository: NotificationRepository) {}

  create(notification: NotificationEntity): Promise<NotificationEntity> {
    return this.repository.save(notification);
  }

  listForUser(userId: string): Promise<NotificationEntity[]> {
    return this.repository.findByUser(userId);
  }

  markRead(id: string): Promise<NotificationEntity | undefined> {
    return this.repository.markRead(id);
  }

  markAllRead(userId: string): Promise<void> {
    return this.repository.markAllRead(userId);
  }
}
