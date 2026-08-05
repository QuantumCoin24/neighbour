import type { Business } from '@neighbour/api-client';
import { StyleSheet, View } from 'react-native';

import { AppText, Card } from '../../../components';
import { useNeighbourTheme } from '../../../theme';

export function CommunityBusinessCard({ business }: { business: Business }) {
  const { theme } = useNeighbourTheme();

  return (
    <Card variant="muted" style={styles.card}>
      <View
        style={[
          styles.icon,
          {
            backgroundColor: `${theme.colors.business}18`,
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        <AppText
          style={{
            color: theme.colors.business,
            fontSize: 22,
          }}
        >
          ▣
        </AppText>
      </View>

      <View style={styles.copy}>
        <View style={styles.heading}>
          <AppText variant="bodyStrong" numberOfLines={1} style={styles.title}>
            {business.name}
          </AppText>

          {business.verified ? (
            <AppText variant="caption" tone="brand">
              Verified ✓
            </AppText>
          ) : null}
        </View>

        <AppText variant="caption" tone="brand">
          {business.category}
        </AppText>

        <AppText variant="caption" tone="secondary" numberOfLines={3}>
          {business.description}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
  },
  icon: {
    alignItems: 'center',
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  copy: {
    flex: 1,
    gap: 5,
  },
  heading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  title: {
    flex: 1,
  },
});
