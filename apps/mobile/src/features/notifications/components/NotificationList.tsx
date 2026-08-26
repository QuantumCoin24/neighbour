import type { Notification } from '@neighbour/api-client';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card } from '../../../components';
import type { RootStackParamList } from '../../../navigation/routes';
import { useNeighbourTheme } from '../../../theme';
import { useNotifications } from '../context/notification-context';

import { NotificationCard } from './NotificationCard';
import { NotificationEmptyState } from './NotificationEmptyState';

export function NotificationList() {
  const { theme } = useNeighbourTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const notifications = useNotifications();

  async function openNotification(notification: Notification) {
    await notifications.markRead(notification.id);

    if (notification.type === 'MESSAGE') {
      navigation.navigate('App', {
        screen: 'Messages',
      });
      return;
    }

    if (notification.type === 'CONNECTION') {
      if (notification.actor?.username) {
        navigation.navigate('PublicProfile', {
          username: notification.actor.username,
          userId: notification.actor.id,
          displayName: notification.actor.displayName,
        });
      } else {
        navigation.navigate('Search');
      }

      return;
    }

    if (notification.type.includes('COMMUNITY')) {
      navigation.navigate('App', {
        screen: 'Communities',
      });
      return;
    }

    if (notification.type.includes('MARKETPLACE')) {
      navigation.navigate('Marketplace');
      return;
    }

    navigation.navigate('App', {
      screen: 'Home',
    });
  }

  if (notifications.loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.colors.primary} size="large" />

        <AppText tone="secondary">Loading your notifications…</AppText>
      </View>
    );
  }

  if (notifications.error && notifications.items.length === 0) {
    return (
      <Card variant="muted" style={styles.error}>
        <AppText
          variant="bodyStrong"
          style={{
            color: theme.colors.danger,
          }}
        >
          Notifications unavailable
        </AppText>

        <AppText tone="secondary">{notifications.error}</AppText>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void notifications.retry();
          }}
        >
          <AppText variant="label" tone="brand">
            Try again
          </AppText>
        </Pressable>
      </Card>
    );
  }

  if (notifications.items.length === 0) {
    return <NotificationEmptyState />;
  }

  return (
    <View style={styles.list}>
      {notifications.items.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onDismiss={() => {
            void notifications.dismiss(notification.id);
          }}
          onOpen={() => {
            void openNotification(notification);
          }}
        />
      ))}

      {notifications.loadingMore ? (
        <View style={styles.loadingMore}>
          <ActivityIndicator color={theme.colors.primary} size="small" />

          <AppText variant="caption" tone="secondary">
            Loading more notifications…
          </AppText>
        </View>
      ) : null}

      {!notifications.loadingMore && notifications.nextCursor ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void notifications.loadMore();
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
            Load more notifications
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
  error: {
    gap: 10,
  },
  loadingMore: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  loadMore: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 54,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
});
