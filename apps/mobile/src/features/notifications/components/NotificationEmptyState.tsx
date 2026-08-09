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
            backgroundColor: theme.colors.primarySoft,
            borderRadius: theme.radius.pill,
          },
        ]}
      >
        <AppText
          style={{
            color: theme.colors.primary,
            fontSize: 27,
            lineHeight: 31,
          }}
        >
          ✓
        </AppText>
      </View>

      <View style={styles.copy}>
        <AppText variant="overline" tone="brand">
          YOU'RE UP TO DATE
        </AppText>

        <AppText variant="subheading">You are all caught up</AppText>

        <AppText tone="secondary">
          New messages, reactions, community activity and local updates will appear here.
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: 18,
    paddingVertical: 24,
  },

  icon: {
    alignItems: 'center',
    height: 62,
    justifyContent: 'center',
    width: 62,
  },

  copy: {
    alignItems: 'center',
    gap: 7,
    maxWidth: 340,
  },
});
