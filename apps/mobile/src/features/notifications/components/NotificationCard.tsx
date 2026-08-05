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
  title: string;
  description: string;
} {
  const actor = notification.actor?.displayName ?? 'A neighbour';

  switch (notification.type) {
    case 'COMMENT':
      return {
        symbol: '💬',
        title: `${actor} commented`,
        description: 'Someone joined the conversation on your post.',
      };

    case 'REPLY':
      return {
        symbol: '↩',
        title: `${actor} replied`,
        description: 'A neighbour replied to your comment.',
      };

    case 'REACTION':
      return {
        symbol: '❤️',
        title: `${actor} reacted`,
        description: 'Your post received a new reaction.',
      };

    case 'MESSAGE':
      return {
        symbol: '✉',
        title: `${actor} sent a message`,
        description: 'You have a new conversation update.',
      };

    case 'CONNECTION':
      return {
        symbol: '◎',
        title: `${actor} connected with you`,
        description: 'Your Neighbour network is growing.',
      };

    case 'COMMUNITY_INVITE':
      return {
        symbol: '⌂',
        title: 'Community invitation',
        description: `${actor} invited you to join a community.`,
      };

    default:
      return {
        symbol: '◇',
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
        unread
          ? {
              borderColor: theme.colors.primary,
            }
          : undefined,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        onPress={onOpen}
        style={({ pressed }) => [
          styles.main,
          {
            opacity: pressed ? 0.75 : 1,
          },
        ]}
      >
        {notification.actor ? (
          <FeedAvatar
            avatarUrl={notification.actor.avatarUrl}
            displayName={notification.actor.displayName}
          />
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
            <AppText style={styles.symbolText}>{presentation.symbol}</AppText>
          </View>
        )}

        <View style={styles.copy}>
          <View style={styles.titleRow}>
            <AppText variant="bodyStrong">{presentation.title}</AppText>

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

          <AppText variant="caption" tone="secondary">
            {presentation.description}
          </AppText>

          <RelativeTime date={notification.createdAt} />
        </View>
      </Pressable>

      <Pressable
        accessibilityLabel="Dismiss notification"
        accessibilityRole="button"
        onPress={onDismiss}
        style={({ pressed }) => [
          styles.dismiss,
          {
            borderTopColor: theme.colors.border,
            opacity: pressed ? 0.68 : 1,
          },
        ]}
      >
        <AppText variant="caption" tone="muted">
          Dismiss
        </AppText>
      </Pressable>
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
    gap: 13,
  },
  symbol: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  symbolText: {
    fontSize: 20,
    lineHeight: 24,
  },
  copy: {
    flex: 1,
    gap: 5,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  unreadDot: {
    height: 8,
    width: 8,
  },
  dismiss: {
    alignItems: 'flex-end',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 11,
  },
});
