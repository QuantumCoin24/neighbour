import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { AppText, Screen } from '../components';
import { NotificationList, useNotifications } from '../features/notifications';
import { useNeighbourTheme } from '../theme';

export default function NotificationsScreen() {
  const { theme } = useNeighbourTheme();
  const notifications = useNotifications();

  return (
    <Screen
      contentStyle={styles.screen}
      refreshControl={
        <RefreshControl
          refreshing={notifications.refreshing}
          onRefresh={() => {
            void notifications.refresh();
          }}
          tintColor={theme.colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.heading}>
          <AppText variant="overline" tone="brand">
            Stay informed
          </AppText>

          <AppText variant="title">Notifications</AppText>

          <AppText variant="bodyLarge" tone="secondary">
            Important community activity, messages and local alerts from across Neighbour.
          </AppText>
        </View>

        {notifications.unreadCount > 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void notifications.markAllRead();
            }}
            style={({ pressed }) => [
              styles.markAllButton,
              {
                backgroundColor: theme.colors.primarySoft,
                borderRadius: theme.radius.pill,
                opacity: pressed ? 0.72 : 1,
              },
            ]}
          >
            <AppText variant="label" tone="brand">
              Mark all read
            </AppText>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.summary}>
        <AppText variant="caption" tone="secondary">
          {notifications.unreadCount === 0
            ? 'No unread notifications'
            : notifications.unreadCount === 1
              ? '1 unread notification'
              : `${notifications.unreadCount} unread notifications`}
        </AppText>
      </View>

      <NotificationList />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 22,
    paddingBottom: 40,
  },
  header: {
    gap: 18,
  },
  heading: {
    gap: 10,
  },
  markAllButton: {
    alignSelf: 'flex-start',
    minHeight: 42,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  summary: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
