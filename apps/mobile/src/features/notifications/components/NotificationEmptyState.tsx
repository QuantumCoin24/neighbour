import { StyleSheet, View } from 'react-native';

import { AppText, Card } from '../../../components';
import { useNeighbourTheme } from '../../../theme';

export function NotificationEmptyState() {
  const { theme } = useNeighbourTheme();

  return (
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
            fontSize: 26,
          }}
        >
          ◇
        </AppText>
      </View>

      <View style={styles.copy}>
        <AppText variant="subheading">You are all caught up</AppText>

        <AppText tone="secondary">
          Community activity, messages, reactions and local updates will appear here.
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  icon: {
    alignItems: 'center',
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  copy: {
    flex: 1,
    gap: 6,
  },
});
