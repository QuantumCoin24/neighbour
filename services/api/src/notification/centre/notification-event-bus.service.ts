import { Injectable } from '@nestjs/common';

export interface NotificationCreatedEvent {
  type: 'notification.created';
  id: string;
  userId: string;
  notificationType: string;
  title: string;
  message: string;
}

export type NotificationEventHandler = (event: NotificationCreatedEvent) => void;

@Injectable()
export class NotificationEventBusService {
  private handlers: NotificationEventHandler[] = [];

  subscribe(handler: NotificationEventHandler): () => void {
    this.handlers.push(handler);

    return () => {
      this.handlers = this.handlers.filter((item) => item !== handler);
    };
  }

  publish(event: NotificationCreatedEvent): void {
    for (const handler of this.handlers) {
      handler(event);
    }
  }
}
