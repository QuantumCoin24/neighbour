import { Injectable } from '@nestjs/common';

import type { PreferenceEntity } from './preference.entity';

@Injectable()
export class PreferenceService {
  private preferences: PreferenceEntity[] = [];

  save(preference: PreferenceEntity): PreferenceEntity {
    this.preferences.push(preference);

    return preference;
  }

  findForUser(userId: string): PreferenceEntity[] {
    return this.preferences.filter((item) => item.userId === userId);
  }
}
