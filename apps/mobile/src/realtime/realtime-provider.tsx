import { useAuth } from '../auth/auth-context';
import { getSessionAccessToken } from '../auth/session';
import { AppState, type AppStateStatus } from 'react-native';
import { io, type Socket } from 'socket.io-client';
import { type PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getRealtimeNamespaceUrl } from './config';
import { RealtimeEvents } from './events';
import { RealtimeContextBoundary, type RealtimeContextValue } from './realtime-context';
import type {
  RealtimeConnectionReady,
  RealtimeConnectionStatus,
  RealtimeEnvelope,
  RealtimeHeartbeatState,
  RealtimeListener,
  RealtimeRoomMembership,
  RealtimeTypingState,
  RealtimeUnsubscribe,
} from './types';

type RealtimeSocket = Socket;

const HEARTBEAT_INTERVAL_MS = 30_000;
const ACKNOWLEDGEMENT_TIMEOUT_MS = 10_000;

function getRealtimeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'The realtime connection could not be established.';
}

export function RealtimeProvider({ children }: PropsWithChildren) {
  const { status: authStatus, user } = useAuth();

  const socketRef = useRef<RealtimeSocket | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [status, setStatus] = useState<RealtimeConnectionStatus>('idle');
  const [connection, setConnection] = useState<RealtimeConnectionReady | null>(null);
  const [lastConnectedAt, setLastConnectedAt] = useState<string | null>(null);
  const [lastHeartbeatAt, setLastHeartbeatAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopHeartbeatTimer = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    stopHeartbeatTimer();

    const socket = socketRef.current;

    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    }

    setConnection(null);
    setStatus('disconnected');
  }, [stopHeartbeatTimer]);

  const heartbeat = useCallback(
    (): Promise<RealtimeHeartbeatState> =>
      new Promise((resolve, reject) => {
        const socket = socketRef.current;

        if (!socket?.connected) {
          reject(new Error('The realtime connection is not currently available.'));

          return;
        }

        const timeout = setTimeout(() => {
          reject(new Error('The realtime heartbeat was not acknowledged.'));
        }, ACKNOWLEDGEMENT_TIMEOUT_MS);

        socket.emit(
          RealtimeEvents.HEARTBEAT,
          {
            clientTimestamp: new Date().toISOString(),
          },
          (response: RealtimeEnvelope<RealtimeHeartbeatState>) => {
            clearTimeout(timeout);
            setLastHeartbeatAt(response.data.acknowledgedAt);
            resolve(response.data);
          },
        );
      }),
    [],
  );

  const startHeartbeatTimer = useCallback(() => {
    stopHeartbeatTimer();

    heartbeatTimerRef.current = setInterval(() => {
      void heartbeat().catch(() => {
        // Socket.IO reconnection handles temporary failures.
      });
    }, HEARTBEAT_INTERVAL_MS);
  }, [heartbeat, stopHeartbeatTimer]);

  const connect = useCallback(() => {
    const token = getSessionAccessToken();

    if (!token || authStatus !== 'authenticated' || !user) {
      disconnect();
      setStatus('idle');

      return;
    }

    const existingSocket = socketRef.current;

    if (existingSocket) {
      existingSocket.auth = {
        token,
      };

      if (!existingSocket.connected) {
        setStatus('connecting');
        existingSocket.connect();
      }

      return;
    }

    setStatus('connecting');
    setError(null);

    const socket = io(getRealtimeNamespaceUrl(), {
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

    socketRef.current = socket;

    socket.on('connect', () => {
      setStatus('connected');
      setError(null);
      setLastConnectedAt(new Date().toISOString());
      startHeartbeatTimer();
    });

    socket.on(
      RealtimeEvents.CONNECTION_READY,
      (payload: RealtimeEnvelope<RealtimeConnectionReady>) => {
        setConnection(payload.data);
        setStatus('connected');
        setError(null);
      },
    );

    socket.on(
      RealtimeEvents.HEARTBEAT_ACKNOWLEDGED,
      (payload: RealtimeEnvelope<RealtimeHeartbeatState>) => {
        setLastHeartbeatAt(payload.data.acknowledgedAt);
      },
    );

    socket.on('disconnect', (reason) => {
      stopHeartbeatTimer();
      setConnection(null);

      if (reason === 'io client disconnect') {
        setStatus('disconnected');
      } else {
        setStatus('connecting');
      }
    });

    socket.on('connect_error', (caughtError) => {
      setStatus('error');
      setError(getRealtimeErrorMessage(caughtError));
    });

    socket.connect();
  }, [authStatus, disconnect, startHeartbeatTimer, stopHeartbeatTimer, user]);

  const subscribe = useCallback(
    <TData,>(event: string, listener: RealtimeListener<TData>): RealtimeUnsubscribe => {
      const socket = socketRef.current;

      if (!socket) {
        return () => undefined;
      }

      const wrappedListener = (payload: RealtimeEnvelope<TData>) => {
        listener(payload);
      };

      socket.on(event, wrappedListener);

      return () => {
        socket.off(event, wrappedListener);
      };
    },
    [],
  );

  const emitWithAcknowledgement = useCallback(
    <TResponse,>(event: string, payload: Record<string, unknown>): Promise<TResponse> =>
      new Promise((resolve, reject) => {
        const socket = socketRef.current;

        if (!socket?.connected) {
          reject(new Error('The realtime connection is not currently available.'));

          return;
        }

        const timeout = setTimeout(() => {
          reject(new Error(`The realtime event "${event}" was not acknowledged.`));
        }, ACKNOWLEDGEMENT_TIMEOUT_MS);

        socket.emit(event, payload, (response: RealtimeEnvelope<TResponse>) => {
          clearTimeout(timeout);
          resolve(response.data);
        });
      }),
    [],
  );

  const joinConversation = useCallback(
    (conversationId: string) =>
      emitWithAcknowledgement<RealtimeRoomMembership>(RealtimeEvents.ROOM_JOIN, {
        conversationId,
      }),
    [emitWithAcknowledgement],
  );

  const leaveConversation = useCallback(
    (conversationId: string) =>
      emitWithAcknowledgement<RealtimeRoomMembership>(RealtimeEvents.ROOM_LEAVE, {
        conversationId,
      }),
    [emitWithAcknowledgement],
  );

  const startTyping = useCallback(
    (conversationId: string) =>
      emitWithAcknowledgement<RealtimeTypingState>(RealtimeEvents.TYPING_START, {
        conversationId,
      }),
    [emitWithAcknowledgement],
  );

  const stopTyping = useCallback(
    (conversationId: string) =>
      emitWithAcknowledgement<RealtimeTypingState>(RealtimeEvents.TYPING_STOP, {
        conversationId,
      }),
    [emitWithAcknowledgement],
  );

  useEffect(() => {
    if (authStatus === 'authenticated' && user) {
      connect();
    } else {
      disconnect();
      setStatus('idle');
    }

    return () => {
      disconnect();
    };
  }, [authStatus, connect, disconnect, user]);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        connect();
      } else if (nextState === 'background' || nextState === 'inactive') {
        disconnect();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [connect, disconnect]);

  const value = useMemo<RealtimeContextValue>(
    () => ({
      status,
      connected: status === 'connected',
      socketId: connection?.socketId ?? null,
      lastConnectedAt,
      lastHeartbeatAt,
      error,
      connect,
      disconnect,
      subscribe,
      joinConversation,
      leaveConversation,
      startTyping,
      stopTyping,
      heartbeat,
      connection,
    }),
    [
      status,
      connection,
      lastConnectedAt,
      lastHeartbeatAt,
      error,
      connect,
      disconnect,
      subscribe,
      joinConversation,
      leaveConversation,
      startTyping,
      stopTyping,
      heartbeat,
    ],
  );

  return <RealtimeContextBoundary value={value}>{children}</RealtimeContextBoundary>;
}
