import { createContext, useContext, type PropsWithChildren } from 'react';

import type {
  RealtimeConnectionReady,
  RealtimeConnectionStatus,
  RealtimeHeartbeatState,
  RealtimeListener,
  RealtimeRoomMembership,
  RealtimeTypingState,
  RealtimeUnsubscribe,
} from './types';

export interface RealtimeContextValue {
  status: RealtimeConnectionStatus;
  connected: boolean;
  socketId: string | null;
  lastConnectedAt: string | null;
  lastHeartbeatAt: string | null;
  error: string | null;

  connect: () => void;
  disconnect: () => void;

  subscribe: <TData>(event: string, listener: RealtimeListener<TData>) => RealtimeUnsubscribe;

  joinConversation: (conversationId: string) => Promise<RealtimeRoomMembership>;

  leaveConversation: (conversationId: string) => Promise<RealtimeRoomMembership>;

  startTyping: (conversationId: string) => Promise<RealtimeTypingState>;

  stopTyping: (conversationId: string) => Promise<RealtimeTypingState>;

  heartbeat: () => Promise<RealtimeHeartbeatState>;

  connection: RealtimeConnectionReady | null;
}

export const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined);

export function useRealtime(): RealtimeContextValue {
  const context = useContext(RealtimeContext);

  if (!context) {
    throw new Error('useRealtime must be used inside RealtimeProvider.');
  }

  return context;
}

export function RealtimeContextBoundary({
  children,
  value,
}: PropsWithChildren<{
  value: RealtimeContextValue;
}>) {
  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}
