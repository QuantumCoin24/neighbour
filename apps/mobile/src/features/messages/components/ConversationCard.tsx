import type { Conversation } from '@neighbour/api-client';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAuth } from '../../../auth/auth-context';
import { AppText, Card } from '../../../components';
import { useNeighbourTheme } from '../../../theme';
import { FeedAvatar, RelativeTime } from '../../feed';

interface ConversationCardProps {
  conversation: Conversation;
  onPress: () => void;
}

export function ConversationCard({ conversation, onPress }: ConversationCardProps) {
  const { user } = useAuth();
  const { theme } = useNeighbourTheme();

  const currentMembership = conversation.members.find((member) => member.user.id === user?.id);

  const otherMembers = conversation.members.filter((member) => member.user.id !== user?.id);

  const primaryMember = otherMembers[0] ?? conversation.members[0];

  const title =
    conversation.title?.trim() ||
    otherMembers.map((member) => member.user.displayName).join(', ') ||
    'Neighbour conversation';

  const preview = conversation.lastMessage?.deletedAt
    ? 'Message removed'
    : conversation.lastMessage?.content?.trim() ||
      (conversation.lastMessage ? 'Shared an attachment' : 'Start the conversation');

  const unreadCount = currentMembership?.unreadCount ?? 0;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.76 : 1,
      })}
    >
      <Card
        variant={unreadCount > 0 ? 'default' : 'muted'}
        style={[
          styles.card,
          unreadCount > 0
            ? {
                borderColor: theme.colors.primary,
              }
            : undefined,
        ]}
      >
        <FeedAvatar
          avatarUrl={primaryMember?.user.avatarUrl ?? null}
          displayName={primaryMember?.user.displayName ?? title}
        />

        <View style={styles.content}>
          <View style={styles.heading}>
            <AppText
              variant={unreadCount > 0 ? 'bodyStrong' : 'body'}
              numberOfLines={1}
              style={styles.title}
            >
              {title}
            </AppText>

            {conversation.lastMessageAt ? <RelativeTime date={conversation.lastMessageAt} /> : null}
          </View>

          <View style={styles.previewRow}>
            <AppText
              variant="caption"
              tone={unreadCount > 0 ? 'primary' : 'secondary'}
              numberOfLines={2}
              style={styles.preview}
            >
              {preview}
            </AppText>

            {unreadCount > 0 ? (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: theme.colors.primary,
                    borderRadius: theme.radius.pill,
                  },
                ]}
              >
                <AppText variant="caption" tone="inverse" style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </AppText>
              </View>
            ) : null}
          </View>

          {currentMembership?.pinnedAt ? (
            <AppText variant="caption" tone="brand">
              Pinned conversation
            </AppText>
          ) : null}
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 13,
  },
  content: {
    flex: 1,
    gap: 6,
  },
  heading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
  },
  previewRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  preview: {
    flex: 1,
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 24,
    minWidth: 24,
    paddingHorizontal: 7,
  },
  badgeText: {
    fontWeight: '700',
  },
});
