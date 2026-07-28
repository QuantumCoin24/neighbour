import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationExpirationService {
  immediate(): number {
    return 0;
  }

  afterSeconds(seconds: number): number {
    return Math.floor(Date.now() / 1000) + Math.max(0, seconds);
  }

  at(date: Date): number {
    return Math.floor(date.getTime() / 1000);
  }
}
