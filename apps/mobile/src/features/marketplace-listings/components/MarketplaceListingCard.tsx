import type { MarketplaceListing } from '@neighbour/api-client';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card } from '../../../components';
import { useNeighbourTheme } from '../../../theme';

import { formatMarketplacePrice, marketplaceCategoryLabel } from '../constants';

interface MarketplaceListingCardProps {
  listing: MarketplaceListing;
  onPress: () => void;
}

export function MarketplaceListingCard({ listing, onPress }: MarketplaceListingCardProps) {
  const { theme } = useNeighbourTheme();

  const imageUrl = listing.media[0]?.asset.url ?? null;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.76 : 1,
        width: '48.5%',
      })}
    >
      <Card style={styles.card}>
        <View
          style={[
            styles.imageFrame,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderRadius: theme.radius.lg,
            },
          ]}
        >
          {imageUrl ? (
            <Image
              resizeMode="cover"
              source={{
                uri: imageUrl,
              }}
              style={styles.image}
            />
          ) : (
            <View style={styles.placeholder}>
              <AppText variant="title" tone="muted">
                ◇
              </AppText>

              <AppText variant="caption" tone="muted">
                No photo
              </AppText>
            </View>
          )}

          {listing.saved ? (
            <View
              style={[
                styles.saved,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.radius.pill,
                },
              ]}
            >
              <AppText tone="brand">♥</AppText>
            </View>
          ) : null}
        </View>

        <View style={styles.copy}>
          <AppText variant="subheading" tone="brand">
            {formatMarketplacePrice(listing.pricePence, listing.isFree)}
          </AppText>

          <AppText variant="bodyStrong" numberOfLines={2}>
            {listing.title}
          </AppText>

          <AppText variant="caption" tone="secondary" numberOfLines={1}>
            {marketplaceCategoryLabel(listing.category)}
          </AppText>

          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {listing.localArea ?? listing.postcodeDistrict ?? 'Nearby'}
          </AppText>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 9,
    padding: 8,
  },
  imageFrame: {
    aspectRatio: 1,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  placeholder: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
    justifyContent: 'center',
  },
  saved: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    right: 7,
    top: 7,
    width: 32,
  },
  copy: {
    gap: 3,
    paddingBottom: 2,
    paddingHorizontal: 2,
  },
});
