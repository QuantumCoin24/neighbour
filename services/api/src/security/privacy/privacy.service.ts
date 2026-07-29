import { Injectable } from '@nestjs/common';

import type { PrivacyEntity } from './privacy.entity';

@Injectable()
export class PrivacyService {
  private settings: PrivacyEntity[] = [];

  save(privacy: PrivacyEntity): PrivacyEntity {
    this.settings.push(privacy);

    return privacy;
  }

  findByUser(userId: string): PrivacyEntity | undefined {
    return this.settings.find((item) => item.userId === userId);
  }
}
