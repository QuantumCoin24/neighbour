import {
  getConversation,
  getConversations,
  markConversationRead as markConversationReadRequest,
  type Conversation,
  type Message,
} from '@neighbour/api-client';
import { type PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';

import { RealtimeEvents, useRealtime, type RealtimeEnvelope } from '../../../realtime';

import { MessageContextBoundary, type MessageContextValue } from './message-context';

const PAGE_SIZE = 30;

interface ConversationUpdatedPayload {
  conversationId: string;
  updatedAt: string;
}

interface MessageReadPayload {
  conversationId: string;
  userId: string;
  messageId: string | null;
  unreadCount: number;
  lastReadAt: string;
}

function sortConversations(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort((left, right) => {
    const leftPinned = left.members.some((member) => member.pinnedAt !== null);
    const rightPinned = right.members.some((member) => member.pinnedAt !== null);

    if (leftPinned !== rightPinned) {
      return leftPinned ? -1 : 1;
    }

    const leftTime = left.lastMessageAt ?? left.updatedAt ?? left.createdAt;
    const rightTime = right.lastMessageAt ?? right.updatedAt ?? right.createdAt;

    return new Date(rightTime).getTime() - new Date(leftTime).getTime();
  });
}

function replaceConversation(current: Conversation[], incoming: Conversation): Conversation[] {
  return sortConversations([
    incoming,
    ...current.filter((conversation) => conversation.id !== incoming.id),
  ]);
}

function getUnreadCount(conversations: Conversation[]): number {
  return conversations.reduce(
    (total, conversation) =>
      total +
      conversation.members.reduce((memberTotal, member) => memberTotal + member.unreadCount, 0),
    0,
  );
}

export function MessageProvider({ children }: PropsWithChildren) {
  const realtime = useRealtime();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getConversations({
        limit: PAGE_SIZE,
      });

      setConversations(sortConversations(response.items));
      setNextCursor(response.nextCursor);
    } catch {
      setError('Your conversations could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    try {
      const response = await getConversations({
        limit: PAGE_SIZE,
      });

      setConversations(sortConversations(response.items));
      setNextCursor(response.nextCursor);
    } catch {
      setError('Your conversations could not be refreshed.');
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
      const response = await getConversations({
        cursor: nextCursor,
        limit: PAGE_SIZE,
      });

      setConversations((current) => {
        const existingIds = new Set(current.map((conversation) => conversation.id));

        return sortConversations([
          ...current,
          ...response.items.filter((conversation) => !existingIds.has(conversation.id)),
        ]);
      });

      setNextCursor(response.nextCursor);
    } catch {
      setError('More conversations could not be loaded.');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, nextCursor]);

  const refreshConversation = useCallback(async (conversationId: string) => {
    try {
      const updated = await getConversation(conversationId);

      setConversations((current) => replaceConversation(current, updated));
    } catch {
      // A later refresh or realtime event can recover this item.
    }
  }, []);

  const markConversationRead = useCallback(
    async (conversationId: string) => {
      const previous = conversations;

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                members: conversation.members.map((member) => ({
                  ...member,
                  unreadCount: 0,
                  lastReadAt: member.lastReadAt ?? new Date().toISOString(),
                })),
              }
            : conversation,
        ),
      );

      try {
        await markConversationReadRequest(conversationId);
        await refreshConversation(conversationId);
      } catch {
        setConversations(previous);
        setError('The conversation could not be marked as read.');
      }
    },
    [conversations, refreshConversation],
  );

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    const unsubscribeCreated = realtime.subscribe<Message>(
      RealtimeEvents.MESSAGE_CREATED,
      (payload: RealtimeEnvelope<Message>) => {
        void refreshConversation(payload.data.conversationId);
      },
    );

    const unsubscribeUpdated = realtime.subscribe<Message>(
      RealtimeEvents.MESSAGE_UPDATED,
      (payload: RealtimeEnvelope<Message>) => {
        void refreshConversation(payload.data.conversationId);
      },
    );

    const unsubscribeDeleted = realtime.subscribe<{
      messageId: string;
      conversationId: string;
      deletedAt: string;
    }>(RealtimeEvents.MESSAGE_DELETED, (payload) => {
      void refreshConversation(payload.data.conversationId);
    });

    const unsubscribeRead = realtime.subscribe<MessageReadPayload>(
      RealtimeEvents.MESSAGE_READ,
      (payload) => {
        void refreshConversation(payload.data.conversationId);
      },
    );

    const unsubscribeConversation = realtime.subscribe<ConversationUpdatedPayload>(
      RealtimeEvents.CONVERSATION_UPDATED,
      (payload) => {
        void refreshConversation(payload.data.conversationId);
      },
    );

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
      unsubscribeRead();
      unsubscribeConversation();
    };
  }, [realtime, refreshConversation]);

  const unreadCount = useMemo(() => getUnreadCount(conversations), [conversations]);

  const value = useMemo<MessageContextValue>(
    () => ({
      conversations,
      unreadCount,
      nextCursor,
      loading,
      refreshing,
      loadingMore,
      error,
      refresh,
      loadMore,
      retry: loadInitial,
      refreshConversation,
      markConversationRead,
    }),
    [
      conversations,
      unreadCount,
      nextCursor,
      loading,
      refreshing,
      loadingMore,
      error,
      refresh,
      loadMore,
      loadInitial,
      refreshConversation,
      markConversationRead,
    ],
  );

  return <MessageContextBoundary value={value}>{children}</MessageContextBoundary>;
}
