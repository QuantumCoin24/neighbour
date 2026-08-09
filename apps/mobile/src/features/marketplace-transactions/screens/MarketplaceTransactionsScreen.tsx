import { getMarketplaceTransactions, type MarketplaceTransaction } from '@neighbour/api-client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../../../auth/auth-context';
import { AppText, Card, Screen } from '../../../components';
import type { RootStackParamList } from '../../../navigation/routes';

type Props = NativeStackScreenProps<RootStackParamList, 'MarketplaceTransactions'>;

function formatPrice(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(value / 100);
}

export default function MarketplaceTransactionsScreen({ navigation }: Props) {
  const { user } = useAuth();

  const [items, setItems] = useState<MarketplaceTransaction[]>([]);
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
      setItems(await getMarketplaceTransactions());
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : 'Transactions could not be loaded.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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

        <AppText variant="title">Transactions</AppText>

        <AppText tone="secondary">
          Track reserved, collected, delivered and completed Marketplace trades.
        </AppText>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
        </View>
      ) : null}

      {error ? (
        <Card style={styles.card}>
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

      {!loading && items.length === 0 ? (
        <Card style={styles.card}>
          <AppText variant="subheading">No transactions yet</AppText>

          <AppText tone="secondary">Accepted Marketplace offers will appear here.</AppText>
        </Card>
      ) : null}

      <View style={styles.list}>
        {items.map((transaction) => {
          const role = transaction.sellerId === user?.id ? 'Selling' : 'Buying';

          return (
            <Pressable
              key={transaction.id}
              accessibilityRole="button"
              onPress={() => {
                navigation.navigate('MarketplaceTransactionDetail', {
                  transactionId: transaction.id,
                });
              }}
            >
              <Card style={styles.card}>
                <View style={styles.row}>
                  <View style={styles.summary}>
                    <AppText variant="subheading">{role}</AppText>

                    <AppText tone="secondary">
                      {transaction.status
                        .replaceAll('_', ' ')
                        .toLowerCase()
                        .replace(/^./, (value) => value.toUpperCase())}
                    </AppText>
                  </View>

                  <AppText variant="label" tone="brand">
                    {formatPrice(transaction.agreedPricePence)}
                  </AppText>
                </View>

                <AppText variant="caption" tone="secondary">
                  Reserved {new Date(transaction.reservedAt).toLocaleDateString('en-GB')}
                </AppText>
              </Card>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 18,
    paddingBottom: 52,
  },
  heading: {
    gap: 6,
  },
  loading: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  list: {
    gap: 12,
  },
  card: {
    gap: 10,
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  summary: {
    flex: 1,
    gap: 4,
  },
  error: {},
});
