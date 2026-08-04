import { Injectable } from '@nestjs/common';

@Injectable()
export class ModerationReadinessService {
  check(moderation: string) {
    return {
      moderation,

      ready: moderation === 'READY',

      checkedAt: new Date(),
    };
  }
}
