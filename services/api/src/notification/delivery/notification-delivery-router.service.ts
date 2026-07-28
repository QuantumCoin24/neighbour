import { Injectable } from '@nestjs/common';

import { PresenceRegistry } from '../../realtime/presence/presence.registry';
import { NotificationRealtimePublisher } from '../events/notification-realtime.publisher';
import { PushNotificationService } from '../push/push-notification.service';
import {
  NotificationDeliveryRoute,
  type NotificationDeliveryResult,
  type RouteNotificationRequest,
} from './notification-delivery.interface';

@Injectable()
export class NotificationDeliveryRouterService {
  constructor(
    private readonly presence: PresenceRegistry,
    private readonly realtime: NotificationRealtimePublisher,
    private readonly push: PushNotificationService,
  ) {}

  async route(request: RouteNotificationRequest): Promise<NotificationDeliveryResult> {
    const online = this.presence.isOnline(request.recipientId);

    if (online) {
      this.realtime.notificationCreated(request.recipientId, request.notification);

      return {
        recipientId: request.recipientId,
        route: NotificationDeliveryRoute.REALTIME,
        online: true,
        realtimeDelivered: true,
        pushDeliveries: [],
      };
    }

    const deliveries = await this.push.sendToUser({
      userId: request.recipientId,
      payload: request.pushPayload,
      ...(request.collapseId
        ? {
            collapseId: request.collapseId,
          }
        : {}),
    });

    if (deliveries.length === 0) {
      return {
        recipientId: request.recipientId,
        route: NotificationDeliveryRoute.NONE,
        online: false,
        realtimeDelivered: false,
        pushDeliveries: [],
      };
    }

    return {
      recipientId: request.recipientId,
      route: NotificationDeliveryRoute.PUSH,
      online: false,
      realtimeDelivered: false,
      pushDeliveries: deliveries.map((delivery) => ({
        deviceId: delivery.deviceId,
        accepted: delivery.result.accepted,
        result: delivery.result,
      })),
    };
  }
}
