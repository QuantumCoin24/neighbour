import {
  getSavedMarketplaceListings,
  toggleMarketplaceListingSaved,
  type MarketplaceListing,
} from '@neighbour/api-client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useCallback, useEffect, useState } from 'react';

import { AppText, Card, Screen } from '../../../components';
import type { RootStackParamList } from '../../../navigation/routes';
import { useNeighbourTheme } from '../../../theme';

import { MarketplaceListingCard } from '../components/MarketplaceListingCard';

type Props = NativeStackScreenProps<RootStackParamList, 'SavedMarketplaceListings'>;

export default function SavedMarketplaceListingsScreen({ navigation }: Props) {
  const { theme } = useNeighbourTheme();

  const [items, setItems] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      setItems(await getSavedMarketplaceListings());
    } catch {
      setError('Your saved listings could not be loaded.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const removeSaved = async (listing: MarketplaceListing) => {
    const previous = items;

    setItems((current) => current.filter((item) => item.id !== listing.id));

    try {
      await toggleMarketplaceListingSaved(listing.id);
    } catch {
      setItems(previous);
      setError('The listing could not be removed from saved items.');
    }
  };

  return (
    <Screen
      contentStyle={styles.screen}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            void load(true);
          }}
          tintColor={theme.colors.primary}
        />
      }
    >
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={[
            styles.roundButton,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <AppText variant="subheading">‹</AppText>
        </Pressable>

        <View style={styles.heading}>
          <AppText variant="overline" tone="brand">
            Neighbour Marketplace™
          </AppText>

          <AppText variant="title">Saved</AppText>

          <AppText variant="caption" tone="secondary">
            Listings you want to come back to.
          </AppText>
        </View>
      </View>

      {error ? (
        <Card
          variant="muted"
          style={[
            styles.errorCard,
            {
              borderColor: theme.colors.danger,
            },
          ]}
        >
          <AppText
            style={{
              color: theme.colors.danger,
            }}
          >
            {error}
          </AppText>

          <Pressable accessibilityRole="button" onPress={() => void load()}>
            <AppText variant="label" tone="brand">
              Try again
            </AppText>
          </Pressable>
        </Card>
      ) : null}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      ) : items.length > 0 ? (
        <View style={styles.grid}>
          {items.map((listing) => (
            <View key={listing.id} style={styles.item}>
              <MarketplaceListingCard
                listing={listing}
                onPress={() => {
                  navigation.navigate('MarketplaceListingDetail', {
                    listingId: listing.id,
                  });
                }}
              />

              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  void removeSaved(listing);
                }}
                style={[
                  styles.remove,
                  {
                    borderColor: theme.colors.borderStrong,
                    borderRadius: theme.radius.pill,
                  },
                ]}
              >
                <AppText variant="caption" tone="brand">
                  Remove
                </AppText>
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <Card variant="muted" style={styles.empty}>
          <AppText variant="subheading">Nothing saved yet</AppText>

          <AppText tone="secondary">Save things you like and they will appear here.</AppText>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              navigation.navigate('MarketplaceListings');
            }}
          >
            <AppText variant="label" tone="brand">
              Browse Marketplace
            </AppText>
          </Pressable>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 16,
    paddingBottom: 56,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 13,
  },
  heading: {
    flex: 1,
    gap: 5,
  },
  roundButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  errorCard: {
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  loading: {
    alignItems: 'center',
    paddingVertical: 55,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  item: {
    gap: 7,
    width: '48.5%',
  },
  remove: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 38,
  },
  empty: {
    gap: 9,
  },
});
