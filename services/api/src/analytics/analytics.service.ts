import { Injectable } from '@nestjs/common';

import type { AnalyticsEventEntity } from './analytics-event.entity';

@Injectable()
export class AnalyticsService {
  private events: AnalyticsEventEntity[] = [];

  record(event: AnalyticsEventEntity): AnalyticsEventEntity {
    this.events.push(event);

    return event;
  }

  list(): AnalyticsEventEntity[] {
    return this.events;
  }

  count(type: string): number {
    return this.events.filter((event) => event.type === type).length;
  }
}
