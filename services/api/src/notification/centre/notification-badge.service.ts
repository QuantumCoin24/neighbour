import { Injectable } from '@nestjs/common';

import { NotificationSummaryService } from './notification-summary.service';

@Injectable()
export class NotificationBadgeService {
  constructor(private readonly summary: NotificationSummaryService) {}

  async count(userId: string): Promise<number> {
    const result = await this.summary.summary(userId);

    return result.unread;
  }
}
