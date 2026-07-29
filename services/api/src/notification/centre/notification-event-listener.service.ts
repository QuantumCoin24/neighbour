import { Injectable, OnModuleInit } from '@nestjs/common';

import { NotificationService } from './notification.service';
import { NotificationEventBusService } from './notification-event-bus.service';

@Injectable()
export class NotificationEventListenerService implements OnModuleInit {
  constructor(
    private readonly eventBus: NotificationEventBusService,
    private readonly notifications: NotificationService,
  ) {}

  onModuleInit(): void {
    this.eventBus.subscribe((event) => {
      this.notifications.create({
        id: event.id,
        userId: event.userId,
        type: event.notificationType,
        title: event.title,
        message: event.message,
        status: 'unread',
        createdAt: new Date(),
      });
    });
  }
}
