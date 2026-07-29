import { Injectable } from '@nestjs/common';

import type { NotificationEntity } from './notification.entity';

import { NotificationRepository } from './notification.repository';

@Injectable()
export class NotificationQueryService {
  constructor(private readonly repository: NotificationRepository) {}

  async inbox(userId: string): Promise<NotificationEntity[]> {
    const notifications = await this.repository.findByUser(userId);

    return notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async unread(userId: string): Promise<NotificationEntity[]> {
    const notifications = await this.inbox(userId);

    return notifications.filter((notification) => notification.status === 'unread');
  }
}
