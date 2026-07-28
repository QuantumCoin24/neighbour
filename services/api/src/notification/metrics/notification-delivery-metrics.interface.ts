export interface NotificationDeliveryMetricsSnapshot {
  realtime: number;
  push: number;
  retryQueued: number;
  failed: number;
}

export enum NotificationDeliveryOutcome {
  REALTIME = 'REALTIME',
  PUSH = 'PUSH',
  RETRY = 'RETRY',
  FAILED = 'FAILED',
}
