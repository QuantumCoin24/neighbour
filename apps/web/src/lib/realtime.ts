import { io, type Socket } from 'socket.io-client';

export const WebRealtimeEvents = {
  NOTIFICATION_CREATED: 'notification.created',
  NOTIFICATION_READ: 'notification.read',
} as const;

export interface RealtimeEnvelope<TData = unknown> {
  eventId?: string;
  event?: string;
  occurredAt: string;
  data: TData;
}

function removeApiPath(value: string): string {
  return value
    .replace(/\/+$/, '')
    .replace(/\/api\/v1$/i, '')
    .replace(/\/api$/i, '');
}

export function getWebRealtimeBaseUrl(): string {
  const configuredRealtimeUrl = process.env.NEXT_PUBLIC_NEIGHBOUR_REALTIME_URL;

  if (configuredRealtimeUrl) {
    return removeApiPath(configuredRealtimeUrl);
  }

  const configuredApiUrl = process.env.NEXT_PUBLIC_NEIGHBOUR_API_URL;

  if (configuredApiUrl) {
    return removeApiPath(configuredApiUrl);
  }

  return 'http://localhost:4000';
}

export function getWebRealtimeNamespaceUrl(): string {
  return `${getWebRealtimeBaseUrl()}/realtime`;
}

export function createWebRealtimeSocket(token: string): Socket {
  return io(getWebRealtimeNamespaceUrl(), {
    auth: {
      token,
    },
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 10_000,
    timeout: 15_000,
    transports: ['websocket'],
  });
}
