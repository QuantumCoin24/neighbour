import { Injectable } from '@nestjs/common';

export type IntelligenceEvent =
  | {
      type: 'recommendation.generated';
      userId: string;
    }
  | {
      type: 'preference.changed';
      userId: string;
    }
  | {
      type: 'activity.recorded';
      userId: string;
      activityType: string;
      entityId?: string;
    };

@Injectable()
export class IntelligenceEventBusService {
  private listeners: ((event: IntelligenceEvent) => void)[] = [];

  subscribe(listener: (event: IntelligenceEvent) => void) {
    this.listeners.push(listener);
  }

  publish(event: IntelligenceEvent) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
