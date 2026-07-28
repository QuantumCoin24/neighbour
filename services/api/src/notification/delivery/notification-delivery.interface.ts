import type { NotificationResponse } from '../interfaces/notification-response.interface';
import type { ApnsPayload, ApnsSendResult } from '../push/apns-payload.interface';

export enum NotificationDeliveryRoute {
  REALTIME = 'REALTIME',
  PUSH = 'PUSH',
  NONE = 'NONE',
}

export interface RouteNotificationRequest {
  recipientId: string;
  notification: NotificationResponse;
  pushPayload: ApnsPayload;
  collapseId?: string;
}

export interface PushDeliverySummary {
  deviceId: string;
  accepted: boolean;
  result: ApnsSendResult;
}

export interface NotificationDeliveryResult {
  recipientId: string;
  route: NotificationDeliveryRoute;
  online: boolean;
  realtimeDelivered: boolean;
  pushDeliveries: PushDeliverySummary[];
}
