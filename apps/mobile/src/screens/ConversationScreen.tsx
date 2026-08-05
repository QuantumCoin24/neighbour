import {
  getConversation,
  getMessages,
  markConversationRead,
  sendMessage,
  type Conversation,
  type Message,
} from '@neighbour/api-client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../auth/auth-context';
import { AppText, Card } from '../components';
import { FeedAvatar, RelativeTime } from '../features/feed';
import { useMessages } from '../features/messages';
import type { RootStackParamList } from '../navigation/routes';
import {
  RealtimeEvents,
  useRealtime,
  type RealtimeEnvelope,
  type RealtimeTypingState,
} from '../realtime';
import { useNeighbourTheme } from '../theme';

type ConversationScreenProps = NativeStackScreenProps<RootStackParamList, 'Conversation'>;

const MESSAGE_PAGE_SIZE = 50;
const TYPING_STOP_DELAY_MS = 1_500;

interface DeletedMessagePayload {
  messageId: string;
  conversationId: string;
  deletedAt: string;
}

interface ReadMessagePayload {
  conversationId: string;
  userId: string;
  messageId: string | null;
  unreadCount: number;
  lastReadAt: string;
}

function sortMessages(messages: Message[]): Message[] {
  return [...messages].sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );
}

function mergeMessage(messages: Message[], incoming: Message): Message[] {
  return sortMessages([incoming, ...messages.filter((message) => message.id !== incoming.id)]);
}

function getConversationTitle(
  conversation: Conversation,
  currentUserId: string | undefined,
): string {
  if (conversation.title?.trim()) {
    return conversation.title;
  }

  const names = conversation.members
    .filter((member) => member.user.id !== currentUserId)
    .map((member) => member.user.displayName);

  return names.join(', ') || 'Neighbour conversation';
}

function MessageBubble({
  message,
  currentUserId,
}: {
  message: Message;
  currentUserId: string | undefined;
}) {
  const { theme } = useNeighbourTheme();

  const mine = message.sender.id === currentUserId;
  const optimistic = message.id.startsWith('optimistic-');
  const removed = Boolean(message.deletedAt);

  return (
    <View style={[styles.messageRow, mine ? styles.messageRowMine : undefined]}>
      {!mine ? (
        <FeedAvatar avatarUrl={message.sender.avatarUrl} displayName={message.sender.displayName} />
      ) : null}

      <View style={[styles.messageColumn, mine ? styles.messageColumnMine : undefined]}>
        {!mine ? (
          <AppText variant="caption" tone="secondary">
            {message.sender.displayName}
          </AppText>
        ) : null}

        <View
          style={[
            styles.bubble,
            {
              backgroundColor: mine ? theme.colors.primary : theme.colors.surfaceMuted,
              borderRadius: theme.radius.xl,
            },
          ]}
        >
          <AppText
            tone={mine ? 'inverse' : 'primary'}
            style={removed ? styles.removedText : undefined}
          >
            {removed
              ? 'This message was removed.'
              : message.content?.trim() || 'Shared an attachment'}
          </AppText>
        </View>

        <View style={styles.messageMeta}>
          <RelativeTime date={message.createdAt} />

          {message.editedAt ? (
            <AppText variant="caption" tone="muted">
              Edited
            </AppText>
          ) : null}

          {optimistic ? (
            <AppText variant="caption" tone="muted">
              Sending…
            </AppText>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export default function ConversationScreen({ navigation, route }: ConversationScreenProps) {
  const { conversationId } = route.params;

  const { user } = useAuth();
  const { theme } = useNeighbourTheme();
  const realtime = useRealtime();
  const messageStore = useMessages();

  const listRef = useRef<FlatList<Message>>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingActiveRef = useRef(false);

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [sending, setSending] = useState(false);
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(
    () => (conversation ? getConversationTitle(conversation, user?.id) : 'Conversation'),
    [conversation, user?.id],
  );

  const typingNames = useMemo(() => {
    if (!conversation) {
      return [];
    }

    return conversation.members
      .filter((member) => typingUserIds.includes(member.user.id) && member.user.id !== user?.id)
      .map((member) => member.user.displayName);
  }, [conversation, typingUserIds, user?.id]);

  const loadConversation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [conversationResponse, messageResponse] = await Promise.all([
        getConversation(conversationId),
        getMessages(conversationId, {
          limit: MESSAGE_PAGE_SIZE,
        }),
      ]);

      setConversation(conversationResponse);
      setMessages(sortMessages(messageResponse.items));
      setNextCursor(messageResponse.nextCursor);

      await markConversationRead(conversationId);
      await messageStore.refreshConversation(conversationId);
    } catch {
      setError('This conversation could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [conversationId, messageStore]);

  const loadOlderMessages = useCallback(async () => {
    if (!nextCursor || loadingOlder) {
      return;
    }

    setLoadingOlder(true);
    setError(null);

    try {
      const response = await getMessages(conversationId, {
        cursor: nextCursor,
        limit: MESSAGE_PAGE_SIZE,
      });

      setMessages((current) => {
        const currentIds = new Set(current.map((message) => message.id));

        return sortMessages([
          ...response.items.filter((message) => !currentIds.has(message.id)),
          ...current,
        ]);
      });

      setNextCursor(response.nextCursor);
    } catch {
      setError('Older messages could not be loaded.');
    } finally {
      setLoadingOlder(false);
    }
  }, [conversationId, loadingOlder, nextCursor]);

  const stopTyping = useCallback(async () => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }

    if (!typingActiveRef.current) {
      return;
    }

    typingActiveRef.current = false;

    try {
      await realtime.stopTyping(conversationId);
    } catch {
      // Typing state is temporary and can expire server-side.
    }
  }, [conversationId, realtime]);

  const scheduleTypingStop = useCallback(() => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    typingTimerRef.current = setTimeout(() => {
      void stopTyping();
    }, TYPING_STOP_DELAY_MS);
  }, [stopTyping]);

  const handleTextChange = useCallback(
    (value: string) => {
      setText(value);

      if (!value.trim()) {
        void stopTyping();
        return;
      }

      if (!typingActiveRef.current) {
        typingActiveRef.current = true;

        void realtime.startTyping(conversationId).catch(() => {
          typingActiveRef.current = false;
        });
      }

      scheduleTypingStop();
    },
    [conversationId, realtime, scheduleTypingStop, stopTyping],
  );

  const submit = useCallback(async () => {
    const content = text.trim();

    if (!content || sending || !user) {
      return;
    }

    await stopTyping();

    const optimisticId = `optimistic-${Date.now()}`;
    const now = new Date().toISOString();
    const clientNonce = `${user.id}-${Date.now()}`;

    const optimisticMessage: Message = {
      id: optimisticId,
      conversationId,
      sender: {
        id: user.id,
        displayName: user.displayName,
        username: null,
        avatarUrl: null,
      },
      parentMessageId: null,
      type: 'TEXT',
      content,
      metadata: null,
      attachments: [],
      editedAt: null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    setMessages((current) => [...current, optimisticMessage]);
    setText('');
    setSending(true);
    setError(null);

    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({
        animated: true,
      });
    });

    try {
      const created = await sendMessage(conversationId, {
        type: 'TEXT',
        content,
        clientNonce,
      });

      setMessages((current) =>
        sortMessages(current.map((message) => (message.id === optimisticId ? created : message))),
      );

      await messageStore.refreshConversation(conversationId);
    } catch {
      setMessages((current) => current.filter((message) => message.id !== optimisticId));
      setText(content);
      setError('Your message could not be sent.');
    } finally {
      setSending(false);
    }
  }, [conversationId, messageStore, sending, stopTyping, text, user]);

  useEffect(() => {
    void loadConversation();
  }, [loadConversation]);

  useEffect(() => {
    let active = true;

    void realtime.joinConversation(conversationId).catch(() => {
      // User events are still emitted to the personal room.
    });

    const unsubscribeCreated = realtime.subscribe<Message>(
      RealtimeEvents.MESSAGE_CREATED,
      (payload: RealtimeEnvelope<Message>) => {
        if (!active || payload.data.conversationId !== conversationId) {
          return;
        }

        setMessages((current) => mergeMessage(current, payload.data));

        void markConversationRead(conversationId, payload.data.id);

        void messageStore.refreshConversation(conversationId);

        requestAnimationFrame(() => {
          listRef.current?.scrollToEnd({
            animated: true,
          });
        });
      },
    );

    const unsubscribeUpdated = realtime.subscribe<Message>(
      RealtimeEvents.MESSAGE_UPDATED,
      (payload) => {
        if (payload.data.conversationId !== conversationId) {
          return;
        }

        setMessages((current) => mergeMessage(current, payload.data));
      },
    );

    const unsubscribeDeleted = realtime.subscribe<DeletedMessagePayload>(
      RealtimeEvents.MESSAGE_DELETED,
      (payload) => {
        if (payload.data.conversationId !== conversationId) {
          return;
        }

        setMessages((current) =>
          current.map((message) =>
            message.id === payload.data.messageId
              ? {
                  ...message,
                  deletedAt: payload.data.deletedAt,
                  content: null,
                }
              : message,
          ),
        );
      },
    );

    const unsubscribeRead = realtime.subscribe<ReadMessagePayload>(
      RealtimeEvents.MESSAGE_READ,
      (payload) => {
        if (payload.data.conversationId === conversationId) {
          void messageStore.refreshConversation(conversationId);
        }
      },
    );

    const handleTyping = (payload: RealtimeEnvelope<RealtimeTypingState>) => {
      const state = payload.data;

      if (state.conversationId !== conversationId || state.userId === user?.id) {
        return;
      }

      setTypingUserIds((current) => {
        if (state.typing) {
          return current.includes(state.userId) ? current : [...current, state.userId];
        }

        return current.filter((userId) => userId !== state.userId);
      });
    };

    const unsubscribeTypingStart = realtime.subscribe<RealtimeTypingState>(
      RealtimeEvents.TYPING_START,
      handleTyping,
    );

    const unsubscribeTypingStop = realtime.subscribe<RealtimeTypingState>(
      RealtimeEvents.TYPING_STOP,
      handleTyping,
    );

    return () => {
      active = false;

      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
      unsubscribeRead();
      unsubscribeTypingStart();
      unsubscribeTypingStop();

      void stopTyping();
      void realtime.leaveConversation(conversationId).catch(() => undefined);
    };
  }, [conversationId, messageStore, realtime, stopTyping, user?.id]);

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <View style={styles.loading}>
          <ActivityIndicator color={theme.colors.primary} size="large" />

          <AppText tone="secondary">Opening conversation…</AppText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.colors.surface,
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
          <Pressable
            accessibilityLabel="Back to messages"
            accessibilityRole="button"
            onPress={() => {
              navigation.goBack();
            }}
            style={({ pressed }) => [
              styles.backButton,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderRadius: theme.radius.pill,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <AppText variant="bodyStrong">‹</AppText>
          </Pressable>

          <View style={styles.headerCopy}>
            <AppText variant="subheading" numberOfLines={1}>
              {title}
            </AppText>

            <AppText variant="caption" tone="secondary">
              {realtime.connected ? 'Connected securely' : 'Reconnecting…'}
            </AppText>
          </View>
        </View>

        {error ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void loadConversation();
            }}
            style={styles.error}
          >
            <AppText
              variant="caption"
              style={{
                color: theme.colors.danger,
              }}
            >
              {error} Tap to retry.
            </AppText>
          </Pressable>
        ) : null}

        <FlatList
          ref={listRef}
          contentContainerStyle={styles.messageList}
          data={messages}
          keyExtractor={(message) => message.id}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Card variant="muted" style={styles.empty}>
              <AppText variant="subheading">Start the conversation</AppText>

              <AppText tone="secondary">Send a secure message to your neighbour.</AppText>
            </Card>
          }
          ListHeaderComponent={
            nextCursor ? (
              <Pressable
                accessibilityRole="button"
                disabled={loadingOlder}
                onPress={() => {
                  void loadOlderMessages();
                }}
                style={[
                  styles.loadOlder,
                  {
                    borderColor: theme.colors.borderStrong,
                    borderRadius: theme.radius.lg,
                  },
                ]}
              >
                {loadingOlder ? (
                  <ActivityIndicator color={theme.colors.primary} size="small" />
                ) : (
                  <AppText variant="label" tone="brand">
                    Load older messages
                  </AppText>
                )}
              </Pressable>
            ) : null
          }
          onContentSizeChange={() => {
            if (!loadingOlder) {
              listRef.current?.scrollToEnd({
                animated: false,
              });
            }
          }}
          renderItem={({ item }) => <MessageBubble currentUserId={user?.id} message={item} />}
          showsVerticalScrollIndicator={false}
        />

        {typingNames.length > 0 ? (
          <View style={styles.typing}>
            <AppText variant="caption" tone="brand">
              {typingNames.length === 1
                ? `${typingNames[0]} is typing…`
                : 'Several neighbours are typing…'}
            </AppText>
          </View>
        ) : null}

        <View
          style={[
            styles.composer,
            {
              backgroundColor: theme.colors.backgroundElevated,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <TextInput
            accessibilityLabel="Write a message"
            editable={!sending}
            maxLength={10_000}
            multiline
            onChangeText={handleTextChange}
            placeholder="Write a message…"
            placeholderTextColor={theme.colors.textMuted}
            selectionColor={theme.colors.primary}
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.inputBackground,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.lg,
                color: theme.colors.text,
              },
            ]}
            value={text}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityState={{
              disabled: !text.trim() || sending,
              busy: sending,
            }}
            disabled={!text.trim() || sending}
            onPress={() => {
              void submit();
            }}
            style={({ pressed }) => [
              styles.sendButton,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.radius.lg,
                opacity: !text.trim() || sending ? 0.45 : pressed ? 0.78 : 1,
              },
            ]}
          >
            {sending ? (
              <ActivityIndicator color={theme.colors.inverseText} size="small" />
            ) : (
              <AppText variant="label" tone="inverse">
                Send
              </AppText>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  loading: {
    alignItems: 'center',
    flex: 1,
    gap: 14,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  error: {
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  messageList: {
    flexGrow: 1,
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  empty: {
    gap: 8,
    marginTop: 40,
  },
  loadOlder: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  messageRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 9,
  },
  messageRowMine: {
    justifyContent: 'flex-end',
  },
  messageColumn: {
    alignItems: 'flex-start',
    flexShrink: 1,
    maxWidth: '78%',
  },
  messageColumnMine: {
    alignItems: 'flex-end',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  removedText: {
    fontStyle: 'italic',
  },
  messageMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    marginTop: 4,
  },
  typing: {
    paddingHorizontal: 18,
    paddingVertical: 7,
  },
  composer: {
    alignItems: 'flex-end',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  input: {
    borderWidth: 1,
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 130,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sendButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 68,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
