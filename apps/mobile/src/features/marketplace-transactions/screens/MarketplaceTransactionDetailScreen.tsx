import {
  cancelMarketplaceTransaction,
  completeMarketplaceTransaction,
  getMarketplaceTransaction,
  type MarketplaceTransaction,
} from '@neighbour/api-client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Alert, Pressable, StyleSheet } from 'react-native';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../../../auth/auth-context';
import { AppText, Card, Screen } from '../../../components';
import type { RootStackParamList } from '../../../navigation/routes';
import { useNeighbourTheme } from '../../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'MarketplaceTransactionDetail'>;

function formatPrice(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(value / 100);
}

export default function MarketplaceTransactionDetailScreen({ navigation, route }: Props) {
  const { theme } = useNeighbourTheme();
  const { user } = useAuth();

  const [transaction, setTransaction] = useState<MarketplaceTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setTransaction(await getMarketplaceTransaction(route.params.transactionId));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : 'Transaction could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, [route.params.transactionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const perform = async (action: () => Promise<MarketplaceTransaction>, message: string) => {
    setActing(true);
    setError(null);

    try {
      setTransaction(await action());
      Alert.alert('MARKETPLACE', message);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : 'Transaction could not be updated.',
      );
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <Screen contentStyle={styles.loading}>
        <ActivityIndicator size="large" />
      </Screen>
    );
  }

  if (!transaction) {
    return (
      <Screen contentStyle={styles.screen}>
        <Card style={styles.card}>
          <AppText variant="subheading">Transaction unavailable</AppText>

          <AppText tone="secondary">{error}</AppText>
        </Card>
      </Screen>
    );
  }

  const isSeller = transaction.sellerId === user?.id;
  const active = transaction.status !== 'COMPLETED' && transaction.status !== 'CANCELLED';

  return (
    <Screen contentStyle={styles.screen}>
      <AppText variant="overline" tone="brand">
        MARKETPLACE
      </AppText>

      <AppText variant="title">Marketplace Transaction</AppText>

      <Card style={styles.card}>
        <AppText variant="subheading">{formatPrice(transaction.agreedPricePence)}</AppText>

        <AppText>
          Status:{' '}
          {transaction.status
            .replaceAll('_', ' ')
            .toLowerCase()
            .replace(/^./, (value) => value.toUpperCase())}
        </AppText>

        <AppText tone="secondary">
          Reserved: {new Date(transaction.reservedAt).toLocaleString('en-GB')}
        </AppText>
      </Card>

      {isSeller && active ? (
        <Pressable
          accessibilityRole="button"
          disabled={acting}
          onPress={() => {
            void perform(
              () => completeMarketplaceTransaction(transaction.id),
              'Transaction completed and listing marked sold.',
            );
          }}
          style={styles.actionButton}
        >
          <AppText variant="label">Complete sale</AppText>
        </Pressable>
      ) : null}

      {active ? (
        <Pressable
          accessibilityRole="button"
          disabled={acting}
          onPress={() => {
            void perform(
              () => cancelMarketplaceTransaction(transaction.id),
              'Transaction cancelled and listing reopened.',
            );
          }}
          style={styles.actionButton}
        >
          <AppText variant="label">Cancel transaction</AppText>
        </Pressable>
      ) : null}

      {acting ? <ActivityIndicator /> : null}

      {error ? (
        <AppText style={[styles.error, { color: theme.colors.danger }]}>{error}</AppText>
      ) : null}
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          navigation.navigate('MarketplaceFulfilment', {
            transactionId: transaction.id,
            sellerId: transaction.sellerId,
          });
        }}
        style={styles.actionButton}
      >
        <AppText variant="label">Open fulfilment</AppText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 18,
    paddingBottom: 52,
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    gap: 10,
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 16,
  },
  error: {},
});
