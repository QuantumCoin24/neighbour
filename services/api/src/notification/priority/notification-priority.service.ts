import { Injectable } from '@nestjs/common';

export type NotificationPriority = 5 | 10;

@Injectable()
export class NotificationPriorityService {
  immediate(): NotificationPriority {
    return 10;
  }

  background(): NotificationPriority {
    return 5;
  }

  resolve(background: boolean): NotificationPriority {
    return background ? this.background() : this.immediate();
  }
}
