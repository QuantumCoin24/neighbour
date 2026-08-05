import {
  dismissNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
} from '@neighbour/api-client';
import { type PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';

import { RealtimeEvents, useRealtime, type RealtimeEnvelope } from '../../../realtime';

import { NotificationContextBoundary, type NotificationContextValue } from './notification-context';

const PAGE_SIZE = 30;

interface NotificationReadRealtimePayload {
  notificationId: string | null;
  recipientId: string;
  readAt: string;
  updatedCount: number;
  all: boolean;
  notification?: Notification;
}

function mergeNotification(current: Notification[], incoming: Notification): Notification[] {
  const remaining = current.filter((notification) => notification.id !== incoming.id);

  return [incoming, ...remaining];
}

export function NotificationProvider({ children }: PropsWithChildren) {
  const realtime = useRealtime();

  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getNotifications({
        limit: PAGE_SIZE,
      });

      setItems(response.items);
      setUnreadCount(response.unreadCount);
      setNextCursor(response.nextCursor);
    } catch {
      setError('Your notifications could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    try {
      const response = await getNotifications({
        limit: PAGE_SIZE,
      });

      setItems(response.items);
      setUnreadCount(response.unreadCount);
      setNextCursor(response.nextCursor);
    } catch {
      setError('Your notifications could not be refreshed.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) {
      return;
    }

    setLoadingMore(true);
    setError(null);

    try {
      const response = await getNotifications({
        cursor: nextCursor,
        limit: PAGE_SIZE,
      });

      setItems((current) => {
        const existingIds = new Set(current.map((notification) => notification.id));

        return [
          ...current,
          ...response.items.filter((notification) => !existingIds.has(notification.id)),
        ];
      });

      setUnreadCount(response.unreadCount);
      setNextCursor(response.nextCursor);
    } catch {
      setError('More notifications could not be loaded.');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, nextCursor]);

  const markRead = useCallback(
    async (notificationId: string) => {
      const previousItems = items;
      const previousUnreadCount = unreadCount;

      const target = items.find((notification) => notification.id === notificationId);

      if (!target || target.readAt) {
        return;
      }

      const optimisticReadAt = new Date().toISOString();

      setItems((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                readAt: optimisticReadAt,
                updatedAt: optimisticReadAt,
              }
            : notification,
        ),
      );

      setUnreadCount((value) => Math.max(0, value - 1));

      try {
        const updated = await markNotificationRead(notificationId);

        setItems((current) =>
          current.map((notification) =>
            notification.id === notificationId ? updated : notification,
          ),
        );
      } catch {
        setItems(previousItems);
        setUnreadCount(previousUnreadCount);
        setError('The notification could not be marked as read.');
      }
    },
    [items, unreadCount],
  );

  const markAllRead = useCallback(async () => {
    if (unreadCount === 0) {
      return;
    }

    const previousItems = items;
    const previousUnreadCount = unreadCount;
    const optimisticReadAt = new Date().toISOString();

    setItems((current) =>
      current.map((notification) => ({
        ...notification,
        readAt: notification.readAt ?? optimisticReadAt,
        updatedAt: notification.readAt ? notification.updatedAt : optimisticReadAt,
      })),
    );
    setUnreadCount(0);

    try {
      await markAllNotificationsRead();
    } catch {
      setItems(previousItems);
      setUnreadCount(previousUnreadCount);
      setError('Notifications could not be marked as read.');
    }
  }, [items, unreadCount]);

  const dismiss = useCallback(
    async (notificationId: string) => {
      const previousItems = items;
      const previousUnreadCount = unreadCount;
      const target = items.find((notification) => notification.id === notificationId);

      setItems((current) => current.filter((notification) => notification.id !== notificationId));

      if (target && !target.readAt) {
        setUnreadCount((value) => Math.max(0, value - 1));
      }

      try {
        await dismissNotification(notificationId);
      } catch {
        setItems(previousItems);
        setUnreadCount(previousUnreadCount);
        setError('The notification could not be dismissed.');
      }
    },
    [items, unreadCount],
  );

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    const unsubscribeCreated = realtime.subscribe<Notification>(
      RealtimeEvents.NOTIFICATION_CREATED,
      (payload: RealtimeEnvelope<Notification>) => {
        setItems((current) => mergeNotification(current, payload.data));

        if (!payload.data.readAt) {
          setUnreadCount((value) => value + 1);
        }
      },
    );

    const unsubscribeRead = realtime.subscribe<NotificationReadRealtimePayload>(
      RealtimeEvents.NOTIFICATION_READ,
      (payload: RealtimeEnvelope<NotificationReadRealtimePayload>) => {
        const data = payload.data;

        if (data.all) {
          setItems((current) =>
            current.map((notification) => ({
              ...notification,
              readAt: notification.readAt ?? data.readAt,
            })),
          );
        } else if (data.notificationId) {
          setItems((current) =>
            current.map((notification) =>
              notification.id === data.notificationId
                ? {
                    ...notification,
                    ...(data.notification ?? {}),
                    readAt: data.readAt,
                  }
                : notification,
            ),
          );
        }

        setUnreadCount(data.updatedCount);
      },
    );

    return () => {
      unsubscribeCreated();
      unsubscribeRead();
    };
  }, [realtime]);

  const value = useMemo<NotificationContextValue>(
    () => ({
      items,
      unreadCount,
      loading,
      refreshing,
      loadingMore,
      nextCursor,
      error,
      refresh,
      loadMore,
      retry: loadInitial,
      markRead,
      markAllRead,
      dismiss,
    }),
    [
      items,
      unreadCount,
      loading,
      refreshing,
      loadingMore,
      nextCursor,
      error,
      refresh,
      loadMore,
      loadInitial,
      markRead,
      markAllRead,
      dismiss,
    ],
  );

  return <NotificationContextBoundary value={value}>{children}</NotificationContextBoundary>;
}
