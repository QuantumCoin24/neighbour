import { Injectable } from '@nestjs/common';

import { RealtimeEvents } from '../../realtime/constants/realtime-events.constant';
import { RealtimeService } from '../../realtime/services/realtime.service';
import type { NotificationResponse } from '../interfaces/notification-response.interface';

export interface NotificationReadRealtimePayload {
  notificationId: string | null;
  recipientId: string;
  readAt: string;
  updatedCount: number;
  all: boolean;
  notification?: NotificationResponse;
}

@Injectable()
export class NotificationRealtimePublisher {
  constructor(private readonly realtime: RealtimeService) {}

  notificationCreated(recipientId: string, notification: NotificationResponse): void {
    this.publish(recipientId, RealtimeEvents.NOTIFICATION_CREATED, notification);
  }

  notificationRead(payload: NotificationReadRealtimePayload): void {
    this.publish(payload.recipientId, RealtimeEvents.NOTIFICATION_READ, payload);
  }

  private publish(
    recipientId: string,
    event: typeof RealtimeEvents.NOTIFICATION_CREATED | typeof RealtimeEvents.NOTIFICATION_READ,
    data: unknown,
  ): void {
    this.realtime.emitToUser(recipientId, event, {
      event,
      occurredAt: new Date().toISOString(),
      data,
    });
  }
}
