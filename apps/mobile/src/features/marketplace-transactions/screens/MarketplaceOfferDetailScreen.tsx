import {
  acceptMarketplacePeerOffer,
  counterMarketplacePeerOffer,
  declineMarketplacePeerOffer,
  getMarketplacePeerOffer,
  withdrawMarketplacePeerOffer,
  type MarketplacePeerOffer,
} from '@neighbour/api-client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../../../auth/auth-context';
import { AppText, Card, Screen } from '../../../components';
import type { RootStackParamList } from '../../../navigation/routes';

type Props = NativeStackScreenProps<RootStackParamList, 'MarketplaceOfferDetail'>;

function formatPrice(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(value / 100);
}

export default function MarketplaceOfferDetailScreen({ navigation, route }: Props) {
  const { user } = useAuth();

  const [offer, setOffer] = useState<MarketplacePeerOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [counterAmount, setCounterAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setOffer(await getMarketplacePeerOffer(route.params.offerId));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : 'The offer could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, [route.params.offerId]);

  useEffect(() => {
    void load();
  }, [load]);

  const perform = async (action: () => Promise<MarketplacePeerOffer>, successMessage: string) => {
    setActing(true);
    setError(null);

    try {
      const updated = await action();
      setOffer(updated);

      Alert.alert('MARKETPLACE', successMessage);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : 'The offer could not be updated.',
      );
    } finally {
      setActing(false);
    }
  };

  const submitCounter = async () => {
    if (!offer) {
      return;
    }

    const amount = Number(counterAmount.replace(',', '.'));

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a valid counter-offer amount.');
      return;
    }

    await perform(
      () =>
        counterMarketplacePeerOffer(offer.id, {
          amountPence: Math.round(amount * 100),
        }),
      'Counter offer sent.',
    );

    setCounterAmount('');
  };

  if (loading) {
    return (
      <Screen contentStyle={styles.loading}>
        <ActivityIndicator size="large" />
      </Screen>
    );
  }

  if (!offer) {
    return (
      <Screen contentStyle={styles.screen}>
        <Card style={styles.section}>
          <AppText variant="subheading">Offer unavailable</AppText>

          <AppText tone="secondary">{error ?? 'This offer could not be found.'}</AppText>
        </Card>
      </Screen>
    );
  }

  const isBuyer = offer.buyerId === user?.id;
  const active = offer.status === 'PENDING' || offer.status === 'COUNTERED';
  const latestActorId = offer.history.at(-1)?.actorId ?? null;
  const canRespond = active && latestActorId !== user?.id;

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.heading}>
        <AppText variant="overline" tone="brand">
          MARKETPLACE
        </AppText>

        <AppText variant="title">{offer.listing.title}</AppText>

        <AppText variant="title" tone="brand">
          {formatPrice(offer.amountPence)}
        </AppText>

        <AppText tone="secondary">
          Status:{' '}
          {offer.status
            .replaceAll('_', ' ')
            .toLowerCase()
            .replace(/^./, (value) => value.toUpperCase())}
        </AppText>
      </View>

      <Card style={styles.section}>
        <AppText variant="subheading">Parties</AppText>

        <AppText>Buyer: {offer.buyer.displayName}</AppText>

        <AppText>Seller: {offer.seller.displayName}</AppText>
      </Card>

      {offer.message ? (
        <Card style={styles.section}>
          <AppText variant="subheading">Message</AppText>

          <AppText>{offer.message}</AppText>
        </Card>
      ) : null}

      <Card style={styles.section}>
        <AppText variant="subheading">Offer Timeline</AppText>

        {offer.history.map((item) => (
          <View key={item.id} style={styles.timelineItem}>
            <AppText variant="label">
              {item.toStatus
                .replaceAll('_', ' ')
                .toLowerCase()
                .replace(/^./, (value) => value.toUpperCase())}
            </AppText>

            {item.amountPence !== null ? (
              <AppText tone="brand">{formatPrice(item.amountPence)}</AppText>
            ) : null}

            {item.note ? (
              <AppText variant="caption" tone="secondary">
                {item.note}
              </AppText>
            ) : null}
          </View>
        ))}
      </Card>

      {canRespond ? (
        <Card style={styles.section}>
          <AppText variant="subheading">Respond</AppText>

          <TextInput
            accessibilityLabel="Counter-offer amount"
            keyboardType="decimal-pad"
            onChangeText={setCounterAmount}
            placeholder="Counter amount"
            style={styles.input}
            value={counterAmount}
          />

          <Pressable
            accessibilityRole="button"
            disabled={acting}
            onPress={() => {
              void submitCounter();
            }}
            style={styles.actionButton}
          >
            <AppText variant="label">Send counter offer</AppText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={acting}
            onPress={() => {
              void perform(
                () => acceptMarketplacePeerOffer(offer.id),
                'Offer accepted. The listing is now reserved.',
              );
            }}
            style={styles.actionButton}
          >
            <AppText variant="label">Accept offer</AppText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={acting}
            onPress={() => {
              void perform(() => declineMarketplacePeerOffer(offer.id), 'Offer declined.');
            }}
            style={styles.actionButton}
          >
            <AppText variant="label">Decline offer</AppText>
          </Pressable>
        </Card>
      ) : null}

      {isBuyer && active ? (
        <Pressable
          accessibilityRole="button"
          disabled={acting}
          onPress={() => {
            void perform(() => withdrawMarketplacePeerOffer(offer.id), 'Offer withdrawn.');
          }}
          style={styles.actionButton}
        >
          <AppText variant="label">Withdraw offer</AppText>
        </Pressable>
      ) : null}

      {offer.transaction ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            navigation.navigate('MarketplaceTransactionDetail', {
              transactionId: offer.transaction!.id,
            });
          }}
          style={styles.actionButton}
        >
          <AppText variant="label">View transaction</AppText>
        </Pressable>
      ) : null}

      {acting ? <ActivityIndicator /> : null}

      {error ? (
        <AppText style={[styles.error, { color: theme.colors.danger }]}>{error}</AppText>
      ) : null}
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
  heading: {
    gap: 6,
  },
  section: {
    gap: 10,
  },
  timelineItem: {
    gap: 4,
    paddingVertical: 6,
  },
  input: {
    minHeight: 48,
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 16,
  },
  error: {},
});
