import { Injectable } from '@nestjs/common';

export type SecurityEvent =
  | {
      type: 'permission.changed';
      subjectId: string;
    }
  | {
      type: 'consent.updated';
      userId: string;
    }
  | {
      type: 'privacy.changed';
      userId: string;
    };

@Injectable()
export class SecurityEventBusService {
  private listeners: ((event: SecurityEvent) => void)[] = [];

  subscribe(listener: (event: SecurityEvent) => void) {
    this.listeners.push(listener);
  }

  publish(event: SecurityEvent) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
