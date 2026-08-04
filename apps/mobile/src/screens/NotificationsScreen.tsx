import { StyleSheet, View } from 'react-native';

import { AppText, Card, Screen } from '../components';
import { useNeighbourTheme } from '../theme';

export default function NotificationsScreen() {
  const { theme } = useNeighbourTheme();

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="overline" tone="brand">
          Stay informed
        </AppText>

        <AppText variant="title">Notifications</AppText>

        <AppText variant="bodyLarge" tone="secondary">
          Important community updates, messages and local alerts will be collected here.
        </AppText>
      </View>

      <Card variant="muted" style={styles.card}>
        <View
          style={[
            styles.icon,
            {
              backgroundColor: `${theme.colors.event}18`,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <AppText
            style={{
              color: theme.colors.event,
              fontSize: 24,
            }}
          >
            ◇
          </AppText>
        </View>

        <View style={styles.copy}>
          <AppText variant="subheading">You are all caught up</AppText>

          <AppText tone="secondary">
            New activity from across your neighbourhood will appear here.
          </AppText>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 10,
  },
  card: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
    marginTop: 32,
  },
  icon: {
    alignItems: 'center',
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  copy: {
    flex: 1,
    gap: 6,
  },
});
