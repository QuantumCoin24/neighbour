import { Injectable } from '@nestjs/common';

import { NotificationExpirationService } from '../expiry/notification-expiration.service';
import { NotificationPriorityService } from '../priority/notification-priority.service';
import { NotificationTopicService } from '../topic/notification-topic.service';

@Injectable()
export class ApnsHeaderBuilderService {
  constructor(
    private readonly topic: NotificationTopicService,
    private readonly priority: NotificationPriorityService,
    private readonly expiration: NotificationExpirationService,
  ) {}

  build(background = false) {
    return {
      'apns-topic': this.topic.get(),
      'apns-priority': String(this.priority.resolve(background)),
      'apns-expiration': String(this.expiration.immediate()),
    };
  }
}
