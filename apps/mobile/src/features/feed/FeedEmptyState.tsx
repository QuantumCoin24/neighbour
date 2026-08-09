import { StyleSheet, View } from 'react-native';

import { AppText, Card } from '../../components';
import { useNeighbourTheme } from '../../theme';

export function FeedEmptyState() {
  const { theme } = useNeighbourTheme();

  return (
    <Card
      variant="muted"
      style={[
        styles.card,
        {
          borderRadius: theme.radius.xl,
        },
      ]}
    >
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
            fontSize: 23,
            fontWeight: '700',
          }}
        >
          ◎
        </AppText>
      </View>

      <View style={styles.copy}>
        <AppText variant="bodyStrong">Your local feed is ready</AppText>

        <AppText variant="caption" tone="secondary" style={styles.description}>
          Posts, recommendations and trusted local updates will appear here as your Neighbour
          community grows.
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    padding: 16,
  },

  icon: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 48,
  },

  copy: {
    flex: 1,
    gap: 4,
  },

  description: {
    lineHeight: 19,
  },
});
