import {
  cancelMarketplacePayment,
  cancelMarketplaceTransaction,
  completeMarketplaceTransaction,
  confirmMarketplacePayment,
  createMarketplacePayment,
  getMyMarketplacePayments,
  getMarketplaceFulfilmentByTransaction,
  getMarketplacePaymentMethods,
  getMarketplaceTransaction,
  refundMarketplacePayment,
  type MarketplaceFulfilment,
  type MarketplacePayment,
  type MarketplacePaymentMethod,
  type MarketplaceTransaction,
} from '@neighbour/api-client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../../../auth/auth-context';
import { AppText, Card, Screen } from '../../../components';
import type { RootStackParamList } from '../../../navigation/routes';
import { useNeighbourTheme } from '../../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'MarketplaceTransactionDetail'>;

const PAYMENT_METHOD_LABELS: Record<MarketplacePaymentMethod, string> = {
  CASH_ON_COLLECTION: 'Cash on collection',
  BANK_TRANSFER: 'Bank transfer',
  CARD: 'Card',
  APPLE_PAY: 'Apple Pay',
  QFN: 'QFN',
};

const PAYMENT_METHODS: MarketplacePaymentMethod[] = [
  'APPLE_PAY',
  'CARD',
  'BANK_TRANSFER',
  'CASH_ON_COLLECTION',
  'QFN',
];

function isMarketplacePaymentMethod(value: string): value is MarketplacePaymentMethod {
  return PAYMENT_METHODS.includes(value as MarketplacePaymentMethod);
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(value / 100);
}

let stripeInitialisationPromise: Promise<void> | null = null;

async function initialiseStripeRuntime(): Promise<void> {
  if (stripeInitialisationPromise) {
    return stripeInitialisationPromise;
  }

  stripeInitialisationPromise = (async () => {
    const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();

    if (!publishableKey) {
      throw new Error('Stripe publishable key is unavailable.');
    }

    if (!/^pk_(test|live)_/.test(publishableKey)) {
      throw new Error('Stripe publishable key is invalid.');
    }

    const { initStripe } = await import('@stripe/stripe-react-native');

    await initStripe({
      publishableKey,
      urlScheme: 'neighbour',
    });
  })();

  try {
    await stripeInitialisationPromise;
  } catch (error) {
    stripeInitialisationPromise = null;
    throw error;
  }
}

async function presentStripePaymentSheet(clientSecret: string): Promise<void> {
  await initialiseStripeRuntime();

  const { initPaymentSheet, presentPaymentSheet } = await import('@stripe/stripe-react-native');

  const { error: initialisationError } = await initPaymentSheet({
    merchantDisplayName: 'Neighbour',
    paymentIntentClientSecret: clientSecret,
    returnURL: 'neighbour://stripe-redirect',
  });

  if (initialisationError) {
    throw new Error(initialisationError.message || 'Stripe PaymentSheet could not be initialised.');
  }

  const { error: presentationError } = await presentPaymentSheet();

  if (presentationError) {
    if (presentationError.code === 'Canceled') {
      throw new Error('Payment cancelled.');
    }

    throw new Error(
      presentationError.message || 'Stripe PaymentSheet could not complete the payment.',
    );
  }
}

export default function MarketplaceTransactionDetailScreen({ navigation, route }: Props) {
  const { theme } = useNeighbourTheme();
  const { user } = useAuth();

  const [transaction, setTransaction] = useState<MarketplaceTransaction | null>(null);
  const [payment, setPayment] = useState<MarketplacePayment | null>(null);
  const [fulfilment, setFulfilment] = useState<MarketplaceFulfilment | null>(null);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<
    MarketplacePaymentMethod[]
  >([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<MarketplacePaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void initialiseStripeRuntime().catch((stripeError) => {
      if (!active) {
        return;
      }

      console.warn(
        'Stripe runtime initialisation failed:',
        stripeError instanceof Error ? stripeError.message : 'Unknown Stripe initialisation error',
      );
    });

    return () => {
      active = false;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [loadedTransaction, payments, methodResponse, loadedFulfilment] = await Promise.all([
        getMarketplaceTransaction(route.params.transactionId),
        getMyMarketplacePayments(),
        getMarketplacePaymentMethods(),
        getMarketplaceFulfilmentByTransaction(route.params.transactionId).catch(() => null),
      ]);

      const enabledMethods = methodResponse.methods
        .filter((item) => item.enabled && isMarketplacePaymentMethod(item.id))
        .map((item) => item.id)
        .filter(isMarketplacePaymentMethod);

      setTransaction(loadedTransaction);
      setPayment(
        payments.find((item) => item.transactionId === route.params.transactionId) ?? null,
      );
      setFulfilment(loadedFulfilment);
      setAvailablePaymentMethods(enabledMethods);
      setSelectedPaymentMethod(
        (current) =>
          current ?? (enabledMethods.includes('CARD') ? 'CARD' : (enabledMethods[0] ?? null)),
      );
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

  const startPayment = async () => {
    if (!transaction) {
      return;
    }

    if (!selectedPaymentMethod) {
      setError('Choose a payment method before continuing.');
      return;
    }

    setActing(true);
    setError(null);

    try {
      const created = await createMarketplacePayment({
        transactionId: transaction.id,
        method: selectedPaymentMethod,
        amountPence: transaction.agreedPricePence,
      });

      setPayment(created);

      if (
        created.provider === 'STRIPE' &&
        created.method === 'CARD' &&
        created.status === 'REQUIRES_ACTION'
      ) {
        if (!created.clientSecret) {
          throw new Error('Stripe client secret is unavailable for this payment.');
        }

        await presentStripePaymentSheet(created.clientSecret);

        Alert.alert(
          'PURCHASE CONFIRMED',
          'Your payment has been submitted securely. Neighbour will refresh the order status.',
        );

        await load();
        return;
      }

      Alert.alert('PAYMENT READY', 'Your Marketplace payment has been created.');
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'The Marketplace payment could not be completed.';

      if (message !== 'Payment cancelled.') {
        setError(message);
      }
    } finally {
      setActing(false);
    }
  };

  const continueStripePayment = async () => {
    if (!payment) {
      return;
    }

    if (payment.provider !== 'STRIPE') {
      setError('This payment is not a Stripe payment.');
      return;
    }

    if (payment.method !== 'CARD') {
      setError('PaymentSheet is currently enabled for card payments only.');
      return;
    }

    if (payment.status !== 'REQUIRES_ACTION') {
      setError('This payment does not currently require card entry.');
      return;
    }

    if (!payment.clientSecret) {
      setError('Stripe client secret is unavailable for this payment.');
      return;
    }

    setActing(true);
    setError(null);

    try {
      await presentStripePaymentSheet(payment.clientSecret);

      Alert.alert(
        'PAYMENT SUBMITTED',
        'Stripe accepted the payment. Neighbour will now refresh the payment status.',
      );

      await load();
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'Stripe payment could not be completed.';

      if (message !== 'Payment cancelled.') {
        setError(message);
      }
    } finally {
      setActing(false);
    }
  };

  const cancelPayment = async () => {
    if (!payment) {
      return;
    }

    setActing(true);
    setError(null);

    try {
      const cancelled = await cancelMarketplacePayment(
        payment.id,
        'Marketplace payment cancelled before transaction cancellation.',
      );

      setPayment(cancelled);

      Alert.alert(
        'PAYMENT CANCELLED',
        'The payment has been cancelled. The transaction can now be cancelled if required.',
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'The Marketplace payment could not be cancelled.',
      );
    } finally {
      setActing(false);
    }
  };

  const refundPayment = async () => {
    if (!payment) {
      return;
    }

    const remainingRefundable = payment.amountPence - payment.refundedAmountPence;

    if (remainingRefundable <= 0) {
      setError('There is no remaining balance available to refund.');
      return;
    }

    setActing(true);
    setError(null);

    try {
      const refunded = await refundMarketplacePayment(
        payment.id,
        remainingRefundable,
        'Marketplace transaction refund.',
      );

      setPayment(refunded);

      Alert.alert('PAYMENT REFUNDED', 'The remaining captured payment has been refunded.');
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'The Marketplace payment could not be refunded.',
      );
    } finally {
      setActing(false);
    }
  };

  const confirmPaymentReceived = async () => {
    if (!payment || !isSeller) {
      return;
    }

    setActing(true);
    setError(null);

    try {
      const confirmed = await confirmMarketplacePayment(payment.id);

      setPayment(confirmed);

      Alert.alert('PAYMENT CONFIRMED', 'Payment has been marked as received.');
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Payment receipt could not be confirmed.',
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
  const isBuyer = transaction.buyerId === user?.id;
  const active = transaction.status !== 'COMPLETED' && transaction.status !== 'CANCELLED';

  const paymentAllowsTransactionCancellation =
    !payment ||
    payment.status === 'CANCELLED' ||
    payment.status === 'FAILED' ||
    payment.status === 'REFUNDED';

  const paymentCanBeCancelled =
    payment?.status === 'PENDING' ||
    payment?.status === 'AUTHORISED' ||
    payment?.status === 'REQUIRES_ACTION';

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

      <Card style={styles.card}>
        <AppText variant="subheading">{isSeller ? 'Sale breakdown' : 'Payment'}</AppText>

        <View style={styles.paymentRow}>
          <AppText tone="secondary">Sale price</AppText>
          <AppText>{formatPrice(transaction.agreedPricePence)}</AppText>
        </View>

        {payment ? (
          <>
            <View style={styles.paymentRow}>
              <AppText tone="secondary">Neighbour commission</AppText>
              <AppText>{formatPrice(payment.platformFeePence)}</AppText>
            </View>

            {payment.processorFeePence > 0 ? (
              <View style={styles.paymentRow}>
                <AppText tone="secondary">Payment processing</AppText>
                <AppText>{formatPrice(payment.processorFeePence)}</AppText>
              </View>
            ) : null}

            {isSeller ? (
              <View style={styles.paymentRow}>
                <AppText variant="label">Your proceeds</AppText>
                <AppText variant="label" tone="brand">
                  {formatPrice(payment.sellerProceedsPence)}
                </AppText>
              </View>
            ) : null}

            {payment.refundedAmountPence > 0 ? (
              <View style={styles.paymentRow}>
                <AppText tone="secondary">Refunded</AppText>
                <AppText>{formatPrice(payment.refundedAmountPence)}</AppText>
              </View>
            ) : null}

            <View style={styles.paymentRow}>
              <AppText tone="secondary">Payment status</AppText>
              <AppText variant="label" tone="brand">
                {payment.status
                  .replaceAll('_', ' ')
                  .toLowerCase()
                  .replace(/^./, (value) => value.toUpperCase())}
              </AppText>
            </View>
          </>
        ) : isBuyer ? (
          <>
            <AppText tone="secondary">Choose how you want to pay for this transaction.</AppText>

            {availablePaymentMethods.length > 0 ? (
              <View style={styles.paymentMethods}>
                {availablePaymentMethods.map((method) => {
                  const selected = selectedPaymentMethod === method;

                  return (
                    <Pressable
                      key={method}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      disabled={acting}
                      onPress={() => {
                        setSelectedPaymentMethod(method);
                      }}
                      style={[
                        styles.paymentMethodButton,
                        selected
                          ? {
                              borderColor: theme.colors.primary,
                              borderWidth: 2,
                            }
                          : null,
                      ]}
                    >
                      <AppText variant="label" tone={selected ? 'brand' : undefined}>
                        {PAYMENT_METHOD_LABELS[method]}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <AppText tone="secondary">No payment methods are currently available.</AppText>
            )}
          </>
        ) : (
          <AppText tone="secondary">Payment has not yet been created by the buyer.</AppText>
        )}

        {isBuyer &&
        active &&
        payment &&
        payment.provider === 'STRIPE' &&
        payment.method === 'CARD' &&
        payment.status === 'REQUIRES_ACTION' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Pay securely by card"
            disabled={acting}
            onPress={() => {
              void continueStripePayment();
            }}
            style={[
              styles.actionButton,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.radius.pill,
              },
            ]}
          >
            <AppText variant="label" tone="inverse">
              Pay securely by card
            </AppText>
          </Pressable>
        ) : null}

        {active && payment && paymentCanBeCancelled ? (
          <Pressable
            accessibilityRole="button"
            disabled={acting}
            onPress={() => {
              Alert.alert('CANCEL PAYMENT', 'Cancel this Marketplace payment?', [
                {
                  text: 'Keep payment',
                  style: 'cancel',
                },
                {
                  text: 'Cancel payment',
                  style: 'destructive',
                  onPress: () => {
                    void cancelPayment();
                  },
                },
              ]);
            }}
            style={styles.actionButton}
          >
            <AppText variant="label">Cancel payment</AppText>
          </Pressable>
        ) : null}

        {isSeller &&
        payment &&
        (payment.status === 'CAPTURED' || payment.status === 'PARTIALLY_REFUNDED') ? (
          <Pressable
            accessibilityRole="button"
            disabled={acting}
            onPress={() => {
              const remainingRefundable = payment.amountPence - payment.refundedAmountPence;

              Alert.alert(
                'REFUND PAYMENT',
                `Refund ${formatPrice(remainingRefundable)} to the buyer?`,
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                  {
                    text: 'Refund',
                    style: 'destructive',
                    onPress: () => {
                      void refundPayment();
                    },
                  },
                ],
              );
            }}
            style={styles.actionButton}
          >
            <AppText variant="label">Refund payment</AppText>
          </Pressable>
        ) : null}

        {isSeller &&
        payment &&
        (payment.status === 'PENDING' || payment.status === 'AUTHORISED') ? (
          <Pressable
            accessibilityRole="button"
            disabled={acting}
            onPress={() => {
              Alert.alert('CONFIRM PAYMENT', 'Confirm that you have received this payment?', [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Confirm received',
                  onPress: () => {
                    void confirmPaymentReceived();
                  },
                },
              ]);
            }}
            style={styles.actionButton}
          >
            <AppText variant="label">Confirm payment received</AppText>
          </Pressable>
        ) : null}

        {isBuyer && active && !payment && availablePaymentMethods.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              selectedPaymentMethod === 'CARD'
                ? 'Pay securely by card'
                : 'Continue with selected payment method'
            }
            disabled={acting || !selectedPaymentMethod}
            onPress={() => {
              void startPayment();
            }}
            style={[
              styles.actionButton,
              selectedPaymentMethod === 'CARD'
                ? {
                    backgroundColor: theme.colors.primary,
                    borderRadius: theme.radius.pill,
                  }
                : null,
            ]}
          >
            <AppText
              variant="label"
              tone={selectedPaymentMethod === 'CARD' ? 'inverse' : undefined}
            >
              {acting
                ? 'Starting payment…'
                : selectedPaymentMethod === 'CARD'
                  ? `Pay securely — ${formatPrice(transaction.agreedPricePence)}`
                  : `Continue with ${
                      selectedPaymentMethod
                        ? PAYMENT_METHOD_LABELS[selectedPaymentMethod]
                        : 'payment'
                    }`}
            </AppText>
          </Pressable>
        ) : null}
      </Card>

      {isSeller &&
      active &&
      payment?.status === 'CAPTURED' &&
      fulfilment?.status !== 'COMPLETED' ? (
        <Card style={styles.card}>
          <AppText variant="subheading">You've sold this item.</AppText>
          <AppText tone="secondary">
            Payment is captured. Fulfil the sale and complete the handover before closing the
            transaction.
          </AppText>
        </Card>
      ) : null}

      {isSeller &&
      active &&
      payment?.status === 'CAPTURED' &&
      fulfilment?.status === 'COMPLETED' ? (
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

      {active && paymentAllowsTransactionCancellation ? (
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
        <AppText variant="label">
          {transaction.status === 'COMPLETED'
            ? 'View purchase'
            : isSeller
              ? 'Fulfil sale'
              : 'View purchase'}
        </AppText>
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
  paymentRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  paymentMethods: {
    gap: 8,
  },
  paymentMethodButton: {
    borderRadius: 14,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 14,
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
