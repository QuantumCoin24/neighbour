import type { Conversation } from '@neighbour/api-client';
import { createContext, type PropsWithChildren, useContext } from 'react';

export interface MessageContextValue {
  conversations: Conversation[];
  unreadCount: number;
  nextCursor: string | null;
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  error: string | null;

  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  retry: () => Promise<void>;
  refreshConversation: (conversationId: string) => Promise<void>;
  markConversationRead: (conversationId: string) => Promise<void>;
}

export const MessageContext = createContext<MessageContextValue | undefined>(undefined);

export function MessageContextBoundary({
  children,
  value,
}: PropsWithChildren<{
  value: MessageContextValue;
}>) {
  return <MessageContext.Provider value={value}>{children}</MessageContext.Provider>;
}

export function useMessages(): MessageContextValue {
  const context = useContext(MessageContext);

  if (!context) {
    throw new Error('useMessages must be used inside MessageProvider.');
  }

  return context;
}
