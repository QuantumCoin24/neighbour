import { StyleSheet, View } from 'react-native';

import { AppText, Card } from '../../components';
import { useNeighbourTheme } from '../../theme';

export function FeedEmptyState() {
  const { theme } = useNeighbourTheme();

  return (
    <Card variant="muted" style={styles.card}>
      <View
        style={[
          styles.icon,
          {
            backgroundColor: theme.colors.surfaceStrong,
            borderRadius: theme.radius.pill,
          },
        ]}
      >
        <AppText
          style={{
            color: theme.colors.primary,
            fontSize: 24,
          }}
        >
          ✦
        </AppText>
      </View>

      <View style={styles.copy}>
        <AppText variant="bodyStrong">Your feed is ready</AppText>

        <AppText variant="caption" tone="secondary">
          Community posts and trusted local updates will appear here as you connect with your area.
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
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  copy: {
    flex: 1,
    gap: 5,
  },
});
