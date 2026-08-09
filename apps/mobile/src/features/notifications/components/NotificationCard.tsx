import type { Notification } from '@neighbour/api-client';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card } from '../../../components';
import { useNeighbourTheme } from '../../../theme';
import { FeedAvatar, RelativeTime } from '../../feed';

interface NotificationCardProps {
  notification: Notification;
  onOpen: () => void;
  onDismiss: () => void;
}

function getNotificationPresentation(notification: Notification): {
  symbol: string;
  eyebrow: string;
  title: string;
  description: string;
} {
  const actor = notification.actor?.displayName ?? 'A neighbour';

  switch (notification.type) {
    case 'COMMENT':
      return {
        symbol: '💬',
        eyebrow: 'POST ACTIVITY',
        title: `${actor} commented`,
        description: 'Someone joined the conversation on your post.',
      };

    case 'REPLY':
      return {
        symbol: '↩',
        eyebrow: 'CONVERSATION',
        title: `${actor} replied`,
        description: 'A neighbour replied to your comment.',
      };

    case 'REACTION':
      return {
        symbol: '♥',
        eyebrow: 'REACTION',
        title: `${actor} reacted`,
        description: 'Your post received a new reaction.',
      };

    case 'MESSAGE':
      return {
        symbol: '✉',
        eyebrow: 'MESSAGE',
        title: `${actor} sent a message`,
        description: 'You have a new conversation update.',
      };

    case 'CONNECTION':
      return {
        symbol: '◎',
        eyebrow: 'CONNECTION',
        title: `${actor} connected with you`,
        description: 'Your Neighbour network is growing.',
      };

    case 'COMMUNITY_INVITE':
      return {
        symbol: '⌂',
        eyebrow: 'COMMUNITY',
        title: 'Community invitation',
        description: `${actor} invited you to join a community.`,
      };

    default:
      return {
        symbol: '◇',
        eyebrow: 'NEIGHBOUR',
        title: 'Neighbour update',
        description: 'There is new activity in your local network.',
      };
  }
}

export function NotificationCard({ notification, onOpen, onDismiss }: NotificationCardProps) {
  const { theme } = useNeighbourTheme();
  const presentation = getNotificationPresentation(notification);
  const unread = !notification.readAt;

  return (
    <Card
      variant={unread ? 'default' : 'muted'}
      style={[
        styles.card,
        {
          borderColor: unread ? theme.colors.primary : theme.colors.border,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${presentation.title}. ${presentation.description}`}
        onPress={onOpen}
        style={({ pressed }) => [
          styles.main,
          {
            opacity: pressed ? 0.72 : 1,
          },
        ]}
      >
        <View style={styles.leading}>
          {notification.actor ? (
            <View style={styles.avatarWrap}>
              <FeedAvatar
                avatarUrl={notification.actor.avatarUrl}
                displayName={notification.actor.displayName}
              />

              <View
                style={[
                  styles.actorSymbol,
                  {
                    backgroundColor: theme.colors.primarySoft,
                    borderColor: theme.colors.surface,
                    borderRadius: theme.radius.pill,
                  },
                ]}
              >
                <AppText
                  style={{
                    color: theme.colors.primary,
                    fontSize: 11,
                    lineHeight: 13,
                  }}
                >
                  {presentation.symbol}
                </AppText>
              </View>
            </View>
          ) : (
            <View
              style={[
                styles.symbol,
                {
                  backgroundColor: theme.colors.primarySoft,
                  borderRadius: theme.radius.pill,
                },
              ]}
            >
              <AppText
                style={{
                  color: theme.colors.primary,
                  fontSize: 20,
                  lineHeight: 24,
                }}
              >
                {presentation.symbol}
              </AppText>
            </View>
          )}
        </View>

        <View style={styles.copy}>
          <View style={styles.metaRow}>
            <AppText
              variant="overline"
              style={{
                color: unread ? theme.colors.primary : theme.colors.textMuted,
              }}
            >
              {presentation.eyebrow}
            </AppText>

            {unread ? (
              <View
                accessibilityLabel="Unread notification"
                style={[
                  styles.unreadDot,
                  {
                    backgroundColor: theme.colors.primary,
                    borderRadius: theme.radius.pill,
                  },
                ]}
              />
            ) : null}
          </View>

          <AppText variant="bodyStrong">{presentation.title}</AppText>

          <AppText variant="caption" tone="secondary">
            {presentation.description}
          </AppText>

          <View style={styles.timeRow}>
            <RelativeTime date={notification.createdAt} />

            {unread ? (
              <AppText variant="caption" tone="brand">
                New
              </AppText>
            ) : null}
          </View>
        </View>
      </Pressable>

      <View
        style={[
          styles.footer,
          {
            borderTopColor: theme.colors.border,
          },
        ]}
      >
        <AppText variant="caption" tone="muted">
          {unread ? 'Tap to mark as read' : 'Read'}
        </AppText>

        <Pressable
          accessibilityLabel="Dismiss notification"
          accessibilityRole="button"
          onPress={onDismiss}
          hitSlop={8}
          style={({ pressed }) => [
            styles.dismiss,
            {
              backgroundColor: pressed ? theme.colors.primarySoft : 'transparent',
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <AppText variant="caption" tone="muted">
            Dismiss
          </AppText>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
  },

  main: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 14,
  },

  leading: {
    flexShrink: 0,
  },

  avatarWrap: {
    position: 'relative',
  },

  actorSymbol: {
    alignItems: 'center',
    borderWidth: 2,
    bottom: -4,
    height: 22,
    justifyContent: 'center',
    position: 'absolute',
    right: -5,
    width: 22,
  },

  symbol: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 48,
  },

  copy: {
    flex: 1,
    gap: 5,
  },

  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },

  unreadDot: {
    height: 8,
    width: 8,
  },

  timeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    marginTop: 2,
  },

  footer: {
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 11,
  },

  dismiss: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
});
