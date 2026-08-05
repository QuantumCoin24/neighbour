import type { Notification } from '@neighbour/api-client';
import { createContext, useContext, type PropsWithChildren } from 'react';

export interface NotificationContextValue {
  items: Notification[];
  unreadCount: number;
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  nextCursor: string | null;
  error: string | null;

  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  retry: () => Promise<void>;
  markRead: (notificationId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  dismiss: (notificationId: string) => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationContextBoundary({
  children,
  value,
}: PropsWithChildren<{
  value: NotificationContextValue;
}>) {
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotifications must be used inside NotificationProvider.');
  }

  return context;
}
