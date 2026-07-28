export interface ApnsAlert {
  title: string;
  body: string;
}

export interface ApnsPayload {
  aps: {
    alert: ApnsAlert;
    sound?: string;
    badge?: number;
    category?: string;
    'thread-id'?: string;
    'content-available'?: 1;
    'mutable-content'?: 1;
  };
  data?: Record<string, string | number | boolean | null>;
}

export interface ApnsSendRequest {
  deviceToken: string;
  payload: ApnsPayload;
  collapseId?: string;
  expiration?: Date;
  priority?: 5 | 10;
}

export interface ApnsSendResult {
  accepted: boolean;
  statusCode: number;
  apnsId: string | null;
  reason: string | null;
  timestamp: number | null;
}
