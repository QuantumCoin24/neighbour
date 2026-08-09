import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { AppText, Card, Screen } from '../components';
import { NotificationList, useNotifications } from '../features/notifications';
import { useNeighbourTheme } from '../theme';

export default function NotificationsScreen() {
  const { theme } = useNeighbourTheme();
  const notifications = useNotifications();

  const unreadLabel =
    notifications.unreadCount === 0
      ? 'All caught up'
      : notifications.unreadCount === 1
        ? '1 unread'
        : `${notifications.unreadCount} unread`;

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
      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <AppText variant="overline" tone="brand">
            YOUR NEIGHBOURHOOD
          </AppText>

          <AppText variant="title">Notifications</AppText>

          <AppText variant="bodyLarge" tone="secondary">
            Keep up with the people, conversations and communities that matter to you.
          </AppText>
        </View>

        <Card
          style={[
            styles.statusCard,
            {
              borderColor:
                notifications.unreadCount > 0 ? theme.colors.primary : theme.colors.border,
            },
          ]}
        >
          <View style={styles.statusTop}>
            <View
              style={[
                styles.statusIcon,
                {
                  backgroundColor: theme.colors.primarySoft,
                  borderRadius: theme.radius.pill,
                },
              ]}
            >
              <AppText
                style={{
                  color: theme.colors.primary,
                  fontSize: 23,
                  lineHeight: 27,
                }}
              >
                ◇
              </AppText>
            </View>

            <View style={styles.statusCopy}>
              <AppText variant="caption" tone="secondary">
                Notification centre
              </AppText>

              <AppText variant="subheading">{unreadLabel}</AppText>
            </View>

            {notifications.unreadCount > 0 ? (
              <View
                accessibilityLabel={`${notifications.unreadCount} unread notifications`}
                style={[
                  styles.countBadge,
                  {
                    backgroundColor: theme.colors.primary,
                    borderRadius: theme.radius.pill,
                  },
                ]}
              >
                <AppText
                  variant="label"
                  style={{
                    color: theme.colors.inverseText,
                  }}
                >
                  {notifications.unreadCount > 99 ? '99+' : notifications.unreadCount}
                </AppText>
              </View>
            ) : null}
          </View>

          <View
            style={[
              styles.statusDivider,
              {
                backgroundColor: theme.colors.border,
              },
            ]}
          />

          <View style={styles.statusBottom}>
            <View style={styles.statusMessage}>
              <AppText variant="caption" tone="secondary">
                {notifications.unreadCount > 0
                  ? 'New activity is waiting for you.'
                  : 'You have seen everything for now.'}
              </AppText>
            </View>

            {notifications.unreadCount > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Mark all notifications as read"
                onPress={() => {
                  void notifications.markAllRead();
                }}
                style={({ pressed }) => [
                  styles.markAllButton,
                  {
                    backgroundColor: theme.colors.primarySoft,
                    borderRadius: theme.radius.pill,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <AppText variant="label" tone="brand">
                  Mark all read
                </AppText>
              </Pressable>
            ) : null}
          </View>
        </Card>
      </View>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeading}>
          <AppText variant="subheading">Recent activity</AppText>

          <AppText variant="caption" tone="secondary">
            Updates from across Neighbour
          </AppText>
        </View>

        {notifications.refreshing ? (
          <AppText variant="caption" tone="brand">
            Refreshing…
          </AppText>
        ) : null}
      </View>

      <NotificationList />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 24,
    paddingBottom: 48,
  },

  hero: {
    gap: 20,
  },

  heroCopy: {
    gap: 9,
  },

  statusCard: {
    gap: 16,
  },

  statusTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 13,
  },

  statusIcon: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 48,
  },

  statusCopy: {
    flex: 1,
    gap: 2,
  },

  countBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 30,
    minWidth: 30,
    paddingHorizontal: 9,
  },

  statusDivider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },

  statusBottom: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },

  statusMessage: {
    flex: 1,
  },

  markAllButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  sectionHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
  },

  sectionHeading: {
    flex: 1,
    gap: 3,
  },
});
