import {
  getMyMarketplaceOffers,
  getReceivedMarketplaceOffers,
  type MarketplacePeerOffer,
} from '@neighbour/api-client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useCallback, useEffect, useState } from 'react';

import { AppText, Card, Screen } from '../../../components';
import type { RootStackParamList } from '../../../navigation/routes';

import { MarketplaceOfferCard } from '../components/MarketplaceOfferCard';

type Props = NativeStackScreenProps<RootStackParamList, 'MarketplaceOffers'>;

type OfferView = 'RECEIVED' | 'SENT';

export default function MarketplaceOffersScreen({ navigation }: Props) {
  const [view, setView] = useState<OfferView>('RECEIVED');
  const [items, setItems] = useState<MarketplacePeerOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const response =
          view === 'RECEIVED'
            ? await getReceivedMarketplaceOffers()
            : await getMyMarketplaceOffers();

        setItems(response.items);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error ? caughtError.message : 'Offers could not be loaded.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [view],
  );

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Screen
      contentStyle={styles.screen}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            void load(true);
          }}
        />
      }
    >
      <View style={styles.heading}>
        <AppText variant="overline" tone="brand">
          MARKETPLACE
        </AppText>

        <AppText variant="title">Offers</AppText>
      </View>

      <View style={styles.tabs}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setView('RECEIVED');
          }}
          style={styles.tab}
        >
          <AppText variant="label" tone={view === 'RECEIVED' ? 'brand' : 'secondary'}>
            Received
          </AppText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setView('SENT');
          }}
          style={styles.tab}
        >
          <AppText variant="label" tone={view === 'SENT' ? 'brand' : 'secondary'}>
            Sent
          </AppText>
        </Pressable>
      </View>

      {error ? (
        <Card style={styles.messageCard}>
          <AppText style={[styles.error, { color: theme.colors.danger }]}>{error}</AppText>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void load();
            }}
          >
            <AppText variant="label" tone="brand">
              Try again
            </AppText>
          </Pressable>
        </Card>
      ) : null}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
        </View>
      ) : items.length > 0 ? (
        <View style={styles.list}>
          {items.map((offer) => (
            <MarketplaceOfferCard
              key={offer.id}
              offer={offer}
              perspective={view === 'RECEIVED' ? 'SELLER' : 'BUYER'}
              onPress={() => {
                navigation.navigate('MarketplaceOfferDetail', {
                  offerId: offer.id,
                });
              }}
            />
          ))}
        </View>
      ) : (
        <Card style={styles.messageCard}>
          <AppText variant="subheading">No {view.toLowerCase()} offers</AppText>

          <AppText tone="secondary">Offers you send and receive will appear here.</AppText>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 18,
    paddingBottom: 48,
  },
  heading: {
    gap: 5,
  },
  tabs: {
    flexDirection: 'row',
    gap: 10,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    minHeight: 46,
    justifyContent: 'center',
  },
  list: {
    gap: 12,
  },
  loading: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  messageCard: {
    gap: 10,
  },
  error: {},
});
