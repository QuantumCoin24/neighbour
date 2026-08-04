export type RealtimeConnectionStatus =
  'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

export interface RealtimeEnvelope<TData = unknown> {
  eventId: string;
  occurredAt: string;
  data: TData;
}

export interface RealtimePresence {
  userId: string;
  online: boolean;
  connectionCount: number;
  changedAt: string;
}

export interface RealtimeConnectionReady {
  socketId: string;
  userId: string;
  presence: RealtimePresence;
}

export interface RealtimeHeartbeatState {
  socketId: string;
  userId: string;
  acknowledgedAt: string;
  clientTimestamp?: string;
}

export interface RealtimeRoomMembership {
  conversationId: string;
  userId: string;
  socketId: string;
  joinedAt?: string;
  leftAt?: string;
}

export interface RealtimeTypingState {
  conversationId: string;
  userId: string;
  socketId: string;
  typing: boolean;
  changedAt: string;
}

export type RealtimeListener<TData = unknown> = (payload: RealtimeEnvelope<TData>) => void;

export type RealtimeUnsubscribe = () => void;
