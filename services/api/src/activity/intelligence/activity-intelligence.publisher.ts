import { Injectable } from '@nestjs/common';

import { IntelligenceEventBusService } from '../../intelligence/events/intelligence-event-bus.service';

@Injectable()
export class ActivityIntelligencePublisher {
  constructor(private readonly intelligenceEvents: IntelligenceEventBusService) {}

  recordFeedAccess(userId: string) {
    this.intelligenceEvents.publish({
      type: 'activity.recorded',

      userId,

      activityType: 'FEED_ACCESS',
    });
  }

  recordPostViewed(userId: string, postId: string) {
    this.intelligenceEvents.publish({
      type: 'activity.recorded',

      userId,

      activityType: 'POST_VIEW',

      entityId: postId,
    });
  }

  recordEventViewed(userId: string, eventId: string) {
    this.intelligenceEvents.publish({
      type: 'activity.recorded',

      userId,

      activityType: 'EVENT_VIEW',

      entityId: eventId,
    });
  }
}
