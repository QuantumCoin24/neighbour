import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card } from '../../../components';
import { useNeighbourTheme } from '../../../theme';
import { useMessages } from '../context/message-context';

import { ConversationCard } from './ConversationCard';

interface ConversationListProps {
  onOpenConversation: (conversationId: string) => void;
}

export function ConversationList({ onOpenConversation }: ConversationListProps) {
  const { theme } = useNeighbourTheme();
  const messages = useMessages();

  if (messages.loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.colors.primary} size="large" />

        <AppText tone="secondary">Loading your conversations…</AppText>
      </View>
    );
  }

  if (messages.error && messages.conversations.length === 0) {
    return (
      <Card variant="muted" style={styles.error}>
        <AppText
          variant="bodyStrong"
          style={{
            color: theme.colors.danger,
          }}
        >
          Conversations unavailable
        </AppText>

        <AppText tone="secondary">{messages.error}</AppText>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void messages.retry();
          }}
        >
          <AppText variant="label" tone="brand">
            Try again
          </AppText>
        </Pressable>
      </Card>
    );
  }

  if (messages.conversations.length === 0) {
    return (
      <Card variant="muted" style={styles.empty}>
        <View
          style={[
            styles.emptyIcon,
            {
              backgroundColor: `${theme.colors.information}18`,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <AppText
            style={{
              color: theme.colors.information,
              fontSize: 25,
            }}
          >
            ◌
          </AppText>
        </View>

        <View style={styles.emptyCopy}>
          <AppText variant="subheading">No conversations yet</AppText>

          <AppText tone="secondary">Your secure Neighbour conversations will appear here.</AppText>
        </View>
      </Card>
    );
  }

  return (
    <View style={styles.list}>
      {messages.conversations.map((conversation) => (
        <ConversationCard
          key={conversation.id}
          conversation={conversation}
          onPress={() => {
            onOpenConversation(conversation.id);
          }}
        />
      ))}

      {messages.loadingMore ? (
        <View style={styles.loadingMore}>
          <ActivityIndicator color={theme.colors.primary} size="small" />
        </View>
      ) : null}

      {!messages.loadingMore && messages.nextCursor ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void messages.loadMore();
          }}
          style={[
            styles.loadMore,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.borderStrong,
              borderRadius: theme.radius.lg,
            },
          ]}
        >
          <AppText variant="bodyStrong" tone="brand">
            Load more conversations
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 14,
  },
  loading: {
    alignItems: 'center',
    gap: 14,
    paddingVertical: 60,
  },
  loadingMore: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  loadMore: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 54,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  error: {
    gap: 10,
  },
  empty: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  emptyIcon: {
    alignItems: 'center',
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  emptyCopy: {
    flex: 1,
    gap: 6,
  },
});
