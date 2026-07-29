import { Injectable } from '@nestjs/common';

import type { NotificationPreferenceEntity } from './notification-preference.entity';

@Injectable()
export class NotificationPreferenceService {
  private preferences: NotificationPreferenceEntity[] = [];

  save(preference: NotificationPreferenceEntity): NotificationPreferenceEntity {
    this.preferences.push(preference);

    return preference;
  }

  findForUser(userId: string): NotificationPreferenceEntity[] {
    return this.preferences.filter((item) => item.userId === userId);
  }
}
