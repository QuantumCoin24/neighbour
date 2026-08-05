import type { NearbyGeoItem } from '@neighbour/api-client';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card } from '../../../components';
import { useNeighbourTheme } from '../../../theme';

interface NearbyPlaceCardProps {
  item: NearbyGeoItem;
  selected?: boolean;
  onPress: () => void;
}

function getPresentation(type: NearbyGeoItem['type']) {
  switch (type) {
    case 'NEIGHBOURHOOD':
      return {
        symbol: '⌖',
        label: 'Neighbourhood',
        tone: 'information' as const,
      };

    case 'COMMUNITY':
      return {
        symbol: '◎',
        label: 'Community',
        tone: 'community' as const,
      };

    case 'EVENT':
      return {
        symbol: '◇',
        label: 'Event',
        tone: 'event' as const,
      };

    case 'BUSINESS':
      return {
        symbol: '▣',
        label: 'Business',
        tone: 'business' as const,
      };
  }
}

function getAddress(item: NearbyGeoItem): string | null {
  const parts = [item.address.addressLine1, item.address.city, item.address.postcode].filter(
    (value): value is string => typeof value === 'string' && value.trim().length > 0,
  );

  return parts.length ? parts.join(', ') : null;
}

export function NearbyPlaceCard({ item, selected = false, onPress }: NearbyPlaceCardProps) {
  const { theme } = useNeighbourTheme();
  const presentation = getPresentation(item.type);

  const accent = {
    information: theme.colors.information,
    community: theme.colors.community,
    event: theme.colors.event,
    business: theme.colors.business,
  }[presentation.tone];

  const address = getAddress(item);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        selected,
      }}
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.76 : 1,
      })}
    >
      <Card
        variant={selected ? 'default' : 'muted'}
        style={[
          styles.card,
          selected
            ? {
                borderColor: accent,
              }
            : undefined,
        ]}
      >
        <View
          style={[
            styles.icon,
            {
              backgroundColor: `${accent}18`,
              borderRadius: theme.radius.lg,
            },
          ]}
        >
          <AppText
            style={{
              color: accent,
              fontSize: 22,
            }}
          >
            {presentation.symbol}
          </AppText>
        </View>

        <View style={styles.copy}>
          <View style={styles.heading}>
            <AppText variant="bodyStrong" numberOfLines={1} style={styles.title}>
              {item.title}
            </AppText>

            <AppText variant="caption" tone="brand">
              {item.distanceKm.toFixed(1)} km
            </AppText>
          </View>

          <AppText variant="caption" tone="secondary">
            {presentation.label}
          </AppText>

          {item.description ? (
            <AppText variant="caption" tone="secondary" numberOfLines={2}>
              {item.description}
            </AppText>
          ) : null}

          {address ? (
            <AppText variant="caption" tone="muted">
              {address}
            </AppText>
          ) : null}
        </View>

        <AppText tone="muted">›</AppText>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 13,
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
  heading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  title: {
    flex: 1,
  },
});
