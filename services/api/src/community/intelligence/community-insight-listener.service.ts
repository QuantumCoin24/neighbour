import { Injectable } from '@nestjs/common';

import { CommunityFeedEventBusService } from '../events/community-feed-event-bus.service';

@Injectable()
export class CommunityInsightListenerService {
  private activity = new Map<string, number>();

  constructor(private readonly events: CommunityFeedEventBusService) {
    this.events.subscribe((event) => this.handle(event));
  }

  handle(event: any) {
    const key = event.type;

    const current = this.activity.get(key) ?? 0;

    this.activity.set(key, current + 1);
  }

  getSignals() {
    return {
      ...Object.fromEntries(this.activity),
    };
  }
}
