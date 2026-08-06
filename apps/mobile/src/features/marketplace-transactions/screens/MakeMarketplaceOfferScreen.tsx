import { createMarketplacePeerOffer } from '@neighbour/api-client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useMemo, useState } from 'react';

import { AppText, Card, Screen } from '../../../components';
import type { RootStackParamList } from '../../../navigation/routes';

type Props = NativeStackScreenProps<RootStackParamList, 'MakeMarketplaceOffer'>;

export default function MakeMarketplaceOfferScreen({ navigation, route }: Props) {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const askingPrice = useMemo(() => {
    if (route.params.askingPricePence === null) {
      return null;
    }

    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(route.params.askingPricePence / 100);
  }, [route.params.askingPricePence]);

  const submit = async () => {
    const numericAmount = Number(amount.replace(',', '.'));

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Enter a valid offer amount.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const offer = await createMarketplacePeerOffer(route.params.listingId, {
        amountPence: Math.round(numericAmount * 100),
        ...(message.trim()
          ? {
              message: message.trim(),
            }
          : {}),
      });

      Alert.alert('Offer sent', 'The seller has received your offer.', [
        {
          text: 'View Offer',
          onPress: () => {
            navigation.replace('MarketplaceOfferDetail', {
              offerId: offer.id,
            });
          },
        },
      ]);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : 'Your offer could not be sent.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.heading}>
        <AppText variant="overline" tone="brand">
          TransactionOS
        </AppText>

        <AppText variant="title">Make an Offer</AppText>

        <AppText tone="secondary">{route.params.listingTitle}</AppText>

        {askingPrice ? (
          <AppText variant="subheading" tone="brand">
            Asking price: {askingPrice}
          </AppText>
        ) : null}
      </View>

      <Card style={styles.form}>
        <AppText variant="label">Your offer</AppText>

        <View style={styles.amountRow}>
          <AppText variant="title">£</AppText>

          <TextInput
            accessibilityLabel="Offer amount"
            keyboardType="decimal-pad"
            onChangeText={setAmount}
            placeholder="0.00"
            style={styles.amountInput}
            value={amount}
          />
        </View>

        <AppText variant="label">Message (optional)</AppText>

        <TextInput
          accessibilityLabel="Offer message"
          maxLength={1_000}
          multiline
          onChangeText={setMessage}
          placeholder="Add a message for the seller"
          style={styles.messageInput}
          value={message}
        />
      </Card>

      {error ? <AppText style={styles.error}>{error}</AppText> : null}

      <Pressable
        accessibilityRole="button"
        disabled={submitting}
        onPress={() => {
          void submit();
        }}
        style={styles.primaryButton}
      >
        {submitting ? <ActivityIndicator /> : <AppText variant="label">Send Offer</AppText>}
      </Pressable>

      <AppText variant="caption" tone="secondary">
        Offers are not payments. Only agree to collection or payment arrangements you understand and
        trust.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 20,
    paddingBottom: 48,
  },
  heading: {
    gap: 6,
  },
  form: {
    gap: 12,
  },
  amountRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 30,
    minHeight: 58,
  },
  messageInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 18,
  },
  error: {
    color: '#b42318',
  },
});
