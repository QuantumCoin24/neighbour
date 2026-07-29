import { Injectable } from '@nestjs/common';

export type TrustEvent =
  | {
      type: 'verification.completed';
      subjectId: string;
    }
  | {
      type: 'reputation.updated';
      userId: string;
    };

@Injectable()
export class TrustEventBusService {
  private listeners: ((event: TrustEvent) => void)[] = [];

  subscribe(listener: (event: TrustEvent) => void) {
    this.listeners.push(listener);
  }

  publish(event: TrustEvent) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
