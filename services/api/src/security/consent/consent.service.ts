import { Injectable } from '@nestjs/common';

import type { ConsentEntity } from './consent.entity';

@Injectable()
export class ConsentService {
  private consents: ConsentEntity[] = [];

  record(consent: ConsentEntity): ConsentEntity {
    this.consents.push(consent);

    return consent;
  }

  hasConsent(userId: string, type: ConsentEntity['type']): boolean {
    return this.consents.some(
      (item) => item.userId === userId && item.type === type && item.accepted,
    );
  }
}
