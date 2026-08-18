import {
  getMarketplaceTransactions,
  getMyMarketplaceListings,
  updateMarketplaceListing,
  type MarketplaceListing,
  type MarketplaceListingStatus,
  type MarketplaceTransaction,
} from '@neighbour/api-client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useCallback, useEffect, useState } from 'react';

import { AppText, Card, Screen } from '../../../components';
import type { RootStackParamList } from '../../../navigation/routes';
import { useNeighbourTheme } from '../../../theme';

import { formatMarketplacePrice } from '../constants';

type Props = NativeStackScreenProps<RootStackParamList, 'MyMarketplaceListings'>;

export default function MyMarketplaceListingsScreen({ navigation }: Props) {
  const { theme } = useNeighbourTheme();

  const [items, setItems] = useState<MarketplaceListing[]>([]);
  const [transactions, setTransactions] = useState<MarketplaceTransaction[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const [listings, marketplaceTransactions] = await Promise.all([
        getMyMarketplaceListings(),
        getMarketplaceTransactions(),
      ]);

      setItems(listings);
      setTransactions(marketplaceTransactions);
    } catch {
      setError('Your marketplace listings could not be loaded.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = async (listing: MarketplaceListing, status: MarketplaceListingStatus) => {
    setUpdatingId(listing.id);
    setError(null);

    try {
      const updated = await updateMarketplaceListing(listing.id, {
        status,
      });

      setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch {
      setError('The listing status could not be changed.');
    } finally {
      setUpdatingId(null);
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
          onPress={() => {
            navigation.goBack();
          }}
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

          <AppText variant="title">Selling</AppText>

          <AppText variant="caption" tone="secondary">
            Manage the things you have listed.
          </AppText>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => {
          navigation.navigate('CreateMarketplaceListing');
        }}
        style={[
          styles.createButton,
          {
            backgroundColor: theme.colors.primary,
            borderRadius: theme.radius.pill,
          },
        ]}
      >
        <AppText variant="label" tone="inverse">
          + Create listing
        </AppText>
      </Pressable>

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
        </Card>
      ) : null}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      ) : items.length > 0 ? (
        <View style={styles.items}>
          {items.map((listing) => (
            <Card key={listing.id} style={styles.listingCard}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  navigation.navigate('MarketplaceListingDetail', {
                    listingId: listing.id,
                  });
                }}
              >
                <View style={styles.listingHeading}>
                  <View style={styles.listingCopy}>
                    <AppText variant="bodyStrong" numberOfLines={2}>
                      {listing.title}
                    </AppText>

                    <AppText variant="caption" tone="secondary">
                      {formatMarketplacePrice(listing.pricePence, listing.isFree)}
                    </AppText>
                  </View>

                  <View
                    style={[
                      styles.status,
                      {
                        backgroundColor: theme.colors.surfaceMuted,
                        borderRadius: theme.radius.pill,
                      },
                    ]}
                  >
                    <AppText variant="caption" tone="brand">
                      {listing.status
                        .replaceAll('_', ' ')
                        .toLowerCase()
                        .replace(/^./, (value) => value.toUpperCase())}
                    </AppText>
                  </View>
                </View>
              </Pressable>

              <View style={styles.controls}>
                {listing.status === 'RESERVED' &&
                transactions.some(
                  (transaction) =>
                    transaction.listingId === listing.id &&
                    transaction.status !== 'COMPLETED' &&
                    transaction.status !== 'CANCELLED',
                ) ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Open active transaction"
                    onPress={() => {
                      const activeTransaction = transactions.find(
                        (transaction) =>
                          transaction.listingId === listing.id &&
                          transaction.status !== 'COMPLETED' &&
                          transaction.status !== 'CANCELLED',
                      );

                      if (!activeTransaction) {
                        return;
                      }

                      navigation.navigate('MarketplaceTransactionDetail', {
                        transactionId: activeTransaction.id,
                      });
                    }}
                    style={[
                      styles.primaryControl,
                      {
                        backgroundColor: theme.colors.primary,
                        borderRadius: theme.radius.pill,
                      },
                    ]}
                  >
                    <AppText variant="caption" tone="inverse">
                      Open transaction
                    </AppText>
                  </Pressable>
                ) : null}

                {listing.status === 'DRAFT' ? (
                  <Pressable
                    accessibilityRole="button"
                    disabled={updatingId === listing.id}
                    onPress={() => {
                      void updateStatus(listing, 'PUBLISHED');
                    }}
                    style={[
                      styles.control,
                      {
                        borderColor: theme.colors.borderStrong,
                        borderRadius: theme.radius.pill,
                      },
                    ]}
                  >
                    <AppText variant="caption" tone="brand">
                      Publish
                    </AppText>
                  </Pressable>
                ) : null}

                {listing.status === 'PUBLISHED' ? (
                  <>
                    <Pressable
                      accessibilityRole="button"
                      disabled={updatingId === listing.id}
                      onPress={() => {
                        void updateStatus(listing, 'RESERVED');
                      }}
                      style={[
                        styles.control,
                        {
                          borderColor: theme.colors.borderStrong,
                          borderRadius: theme.radius.pill,
                        },
                      ]}
                    >
                      <AppText variant="caption" tone="brand">
                        Reserve
                      </AppText>
                    </Pressable>

                    <Pressable
                      accessibilityRole="button"
                      disabled={updatingId === listing.id}
                      onPress={() => {
                        void updateStatus(listing, 'SOLD');
                      }}
                      style={[
                        styles.control,
                        {
                          borderColor: theme.colors.borderStrong,
                          borderRadius: theme.radius.pill,
                        },
                      ]}
                    >
                      <AppText variant="caption" tone="brand">
                        Mark Sold
                      </AppText>
                    </Pressable>
                  </>
                ) : null}

                {listing.status === 'RESERVED' ? (
                  <>
                    <Pressable
                      accessibilityRole="button"
                      disabled={updatingId === listing.id}
                      onPress={() => {
                        void updateStatus(listing, 'PUBLISHED');
                      }}
                      style={[
                        styles.control,
                        {
                          borderColor: theme.colors.borderStrong,
                          borderRadius: theme.radius.pill,
                        },
                      ]}
                    >
                      <AppText variant="caption" tone="brand">
                        Relist
                      </AppText>
                    </Pressable>

                    <Pressable
                      accessibilityRole="button"
                      disabled={updatingId === listing.id}
                      onPress={() => {
                        void updateStatus(listing, 'SOLD');
                      }}
                      style={[
                        styles.control,
                        {
                          borderColor: theme.colors.borderStrong,
                          borderRadius: theme.radius.pill,
                        },
                      ]}
                    >
                      <AppText variant="caption" tone="brand">
                        Mark Sold
                      </AppText>
                    </Pressable>
                  </>
                ) : null}

                {listing.status !== 'ARCHIVED' ? (
                  <Pressable
                    accessibilityRole="button"
                    disabled={updatingId === listing.id}
                    onPress={() => {
                      void updateStatus(listing, 'ARCHIVED');
                    }}
                    style={[
                      styles.control,
                      {
                        borderColor: theme.colors.borderStrong,
                        borderRadius: theme.radius.pill,
                      },
                    ]}
                  >
                    <AppText variant="caption" tone="muted">
                      Archive
                    </AppText>
                  </Pressable>
                ) : null}
              </View>

              {updatingId === listing.id ? (
                <ActivityIndicator color={theme.colors.primary} size="small" />
              ) : null}
            </Card>
          ))}
        </View>
      ) : (
        <Card variant="muted" style={styles.empty}>
          <AppText variant="subheading">Nothing listed yet</AppText>

          <AppText tone="secondary">
            Create a listing to sell or give something to your community.
          </AppText>
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
  createButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  errorCard: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  loading: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  items: {
    gap: 12,
  },
  listingCard: {
    gap: 13,
  },
  listingHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  listingCopy: {
    flex: 1,
    gap: 4,
  },
  status: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  control: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  primaryControl: {
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  empty: {
    gap: 8,
  },
});
