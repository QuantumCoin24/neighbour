import type { ApnsPayload } from '../push/apns-payload.interface';

export interface NotificationRetryJob {
  id: string;
  recipientId: string;
  deviceId: string;
  attempt: number;
  scheduledAt: Date;
  collapseId?: string;
  payload: ApnsPayload;
}
