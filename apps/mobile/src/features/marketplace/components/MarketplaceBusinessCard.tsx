import type { MarketplaceBusiness } from '@neighbour/api-client';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card } from '../../../components';
import { useNeighbourTheme } from '../../../theme';

interface MarketplaceBusinessCardProps {
  business: MarketplaceBusiness;
  onPress: () => void;
}

export function MarketplaceBusinessCard({ business, onPress }: MarketplaceBusinessCardProps) {
  const { theme } = useNeighbourTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.76 : 1,
      })}
    >
      <Card style={styles.card}>
        <View
          style={[
            styles.icon,
            {
              backgroundColor: `${theme.colors.business}18`,
              borderRadius: theme.radius.xl,
            },
          ]}
        >
          <AppText
            style={{
              color: theme.colors.business,
              fontSize: 26,
            }}
          >
            ▣
          </AppText>
        </View>

        <View style={styles.copy}>
          <View style={styles.heading}>
            <AppText variant="subheading" numberOfLines={1} style={styles.title}>
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

          <AppText tone="secondary" numberOfLines={3}>
            {business.description}
          </AppText>

          <AppText variant="caption" tone="muted">
            View business ›
          </AppText>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 14,
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
  heading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    flex: 1,
  },
});
