import { Injectable } from '@nestjs/common';

export type CommunicationEvent =
  | {
      type: 'notification.created';
      notificationId: string;
    }
  | {
      type: 'notification.delivered';
      notificationId: string;
    };

@Injectable()
export class CommunicationEventBusService {
  private listeners: ((event: CommunicationEvent) => void)[] = [];

  subscribe(listener: (event: CommunicationEvent) => void) {
    this.listeners.push(listener);
  }

  publish(event: CommunicationEvent) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
