import { Injectable } from '@nestjs/common';

import { NotificationRepository } from './notification.repository';

@Injectable()
export class NotificationSummaryService {
  constructor(private readonly repository: NotificationRepository) {}

  async summary(userId: string) {
    const notifications = await this.repository.findByUser(userId);

    const unread = notifications.filter((notification) => notification.status === 'unread');

    return {
      total: notifications.length,
      unread: unread.length,
    };
  }
}
