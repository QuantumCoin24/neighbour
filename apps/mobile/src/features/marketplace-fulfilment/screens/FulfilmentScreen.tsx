import {
  confirmMarketplaceFulfilment,
  createMarketplaceCollection,
  createMarketplaceDelivery,
  createMarketplaceFulfilment,
  generateMarketplaceFulfilmentPin,
  generateMarketplaceFulfilmentQr,
  getMarketplaceFulfilmentByTransaction,
  type MarketplaceFulfilment,
  type MarketplaceFulfilmentMethod,
} from '@neighbour/api-client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../../../auth/auth-context';
import { AppText, Card, Screen } from '../../../components';
import type { RootStackParamList } from '../../../navigation/routes';
import { useNeighbourTheme } from '../../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'MarketplaceFulfilment'>;

export default function FulfilmentScreen({ route }: Props) {
  const { theme } = useNeighbourTheme();
  const { user } = useAuth();

  const [fulfilment, setFulfilment] = useState<MarketplaceFulfilment | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [courier, setCourier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setFulfilment(await getMarketplaceFulfilmentByTransaction(route.params.transactionId));
    } catch {
      setFulfilment(null);
    } finally {
      setLoading(false);
    }
  }, [route.params.transactionId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!fulfilment) {
      return;
    }

    const details =
      fulfilment.method === 'COLLECTION' ? fulfilment.collection : fulfilment.delivery;

    if (!details) {
      return;
    }

    setAddressLine1(details.addressLine1 ?? '');
    setCity(details.city ?? '');
    setPostcode(details.postcode ?? '');
    setScheduledFor(details.scheduledFor ?? '');

    if (fulfilment.delivery) {
      setCourier(fulfilment.delivery.courier ?? '');
      setTrackingNumber(fulfilment.delivery.trackingNumber ?? '');
    }
  }, [fulfilment]);

  const create = async (method: MarketplaceFulfilmentMethod) => {
    setActing(true);
    setError(null);

    try {
      setFulfilment(
        await createMarketplaceFulfilment(route.params.transactionId, {
          method,
        }),
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'We could not start the handover. Please try again.',
      );
    } finally {
      setActing(false);
    }
  };

  const saveCollection = async () => {
    if (!fulfilment) {
      return;
    }

    setActing(true);
    setError(null);

    try {
      setFulfilment(
        await createMarketplaceCollection(fulfilment.id, {
          addressLine1,
          city,
          postcode,
          scheduledFor,
        }),
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'We could not save the collection details. Please try again.',
      );
    } finally {
      setActing(false);
    }
  };

  const saveDelivery = async () => {
    if (!fulfilment) {
      setError('Delivery handover is not ready yet. Please reopen this transaction.');
      return;
    }

    const normalisedAddressLine1 = addressLine1.trim();
    const normalisedCity = city.trim();
    const normalisedPostcode = postcode.trim().toUpperCase();
    const normalisedCourier = courier.trim();
    const normalisedTrackingNumber = trackingNumber.trim();

    if (!normalisedAddressLine1 || !normalisedCity || !normalisedPostcode) {
      setError('Enter the delivery address, town or city, and postcode before saving.');
      return;
    }

    setActing(true);
    setError(null);

    try {
      await createMarketplaceDelivery(fulfilment.id, {
        addressLine1: normalisedAddressLine1,
        city: normalisedCity,
        postcode: normalisedPostcode,
        ...(normalisedCourier
          ? {
              courier: normalisedCourier,
            }
          : {}),
        ...(normalisedTrackingNumber
          ? {
              trackingNumber: normalisedTrackingNumber,
            }
          : {}),
      });

      const refreshed = await getMarketplaceFulfilmentByTransaction(route.params.transactionId);

      setFulfilment(refreshed);

      Alert.alert('Delivery saved', 'The delivery details have been saved successfully.');
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'We could not save the delivery details. Please try again.';

      setError(message);

      Alert.alert('Delivery not saved', message);
    } finally {
      setActing(false);
    }
  };

  const generatePin = async () => {
    if (!fulfilment) {
      return;
    }

    setActing(true);

    try {
      const result = await generateMarketplaceFulfilmentPin(fulfilment.id);

      Alert.alert(
        'Collection PIN',
        `${result.pin}\n\nExpires ${new Date(result.expiresAt).toLocaleString('en-GB')}`,
      );
    } finally {
      setActing(false);
    }
  };

  const generateQr = async () => {
    if (!fulfilment) {
      return;
    }

    setActing(true);

    try {
      const result = await generateMarketplaceFulfilmentQr(fulfilment.id);

      Alert.alert('QR handover code', result.token);
    } finally {
      setActing(false);
    }
  };

  const confirm = async () => {
    if (!fulfilment) {
      return;
    }

    setActing(true);

    try {
      setFulfilment(await confirmMarketplaceFulfilment(fulfilment.id));
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

  if (!fulfilment) {
    return (
      <Screen contentStyle={styles.screen}>
        <AppText variant="overline" tone="brand">
          MARKETPLACE
        </AppText>

        <AppText variant="title">How will you exchange the item?</AppText>

        <AppText tone="secondary">
          Choose how the buyer will receive the item. You can then add the handover details
          securely.
        </AppText>

        <Card style={styles.card}>
          {(['COLLECTION', 'DELIVERY', 'POSTAGE'] as MarketplaceFulfilmentMethod[]).map(
            (method) => (
              <Pressable
                key={method}
                accessibilityRole="button"
                disabled={acting}
                onPress={() => {
                  void create(method);
                }}
                style={styles.actionButton}
              >
                <AppText variant="label">
                  {method === 'COLLECTION'
                    ? 'Collection'
                    : method === 'DELIVERY'
                      ? 'Delivery'
                      : 'Postage'}
                </AppText>
              </Pressable>
            ),
          )}
        </Card>

        {error ? (
          <AppText style={[styles.error, { color: theme.colors.danger }]}>{error}</AppText>
        ) : null}
      </Screen>
    );
  }

  const isSeller = route.params.sellerId === user?.id;
  const isBuyer = !isSeller;

  const currentUserConfirmed = isSeller
    ? fulfilment.sellerConfirmedAt !== null
    : fulfilment.buyerConfirmedAt !== null;

  const otherPartyConfirmed = isSeller
    ? fulfilment.buyerConfirmedAt !== null
    : fulfilment.sellerConfirmedAt !== null;

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.heading}>
        <AppText variant="overline" tone="brand">
          MARKETPLACE
        </AppText>

        <AppText variant="title">
          {fulfilment.method === 'COLLECTION'
            ? 'Collection'
            : fulfilment.method === 'DELIVERY'
              ? 'Delivery'
              : 'Postage'}
        </AppText>

        <AppText tone="secondary">
          Status:{' '}
          {fulfilment.status
            .replaceAll('_', ' ')
            .toLowerCase()
            .replace(/^./, (value) => value.toUpperCase())}
        </AppText>
      </View>

      {isSeller && fulfilment.method === 'COLLECTION' ? (
        <Card style={styles.card}>
          <AppText variant="subheading">Arrange collection</AppText>

          <TextInput
            placeholder="Collection or delivery address"
            value={addressLine1}
            onChangeText={setAddressLine1}
            style={styles.input}
          />

          <TextInput
            placeholder="Town or city"
            value={city}
            onChangeText={setCity}
            style={styles.input}
          />

          <TextInput
            placeholder="Postcode"
            value={postcode}
            onChangeText={setPostcode}
            style={styles.input}
          />

          <TextInput
            placeholder="Collection date and time"
            value={scheduledFor}
            onChangeText={setScheduledFor}
            style={styles.input}
          />

          <Pressable
            accessibilityRole="button"
            disabled={acting}
            onPress={() => {
              void saveCollection();
            }}
            style={styles.actionButton}
          >
            <AppText variant="label">Save collection</AppText>
          </Pressable>
        </Card>
      ) : null}

      {isSeller && fulfilment.method !== 'COLLECTION' ? (
        <Card style={styles.card}>
          <AppText variant="subheading">Delivery details</AppText>

          <TextInput
            placeholder="Collection or delivery address"
            value={addressLine1}
            onChangeText={setAddressLine1}
            style={styles.input}
          />

          <TextInput
            placeholder="Town or city"
            value={city}
            onChangeText={setCity}
            style={styles.input}
          />

          <TextInput
            placeholder="Postcode"
            value={postcode}
            onChangeText={setPostcode}
            style={styles.input}
          />

          <TextInput
            placeholder="Courier (optional)"
            value={courier}
            onChangeText={setCourier}
            style={styles.input}
          />

          <TextInput
            placeholder="Tracking number (optional)"
            value={trackingNumber}
            onChangeText={setTrackingNumber}
            style={styles.input}
          />

          <Pressable
            accessibilityRole="button"
            disabled={acting}
            onPress={() => {
              void saveDelivery();
            }}
            style={styles.actionButton}
          >
            <AppText variant="label">{acting ? 'Saving delivery…' : 'Save delivery'}</AppText>
          </Pressable>
        </Card>
      ) : null}

      {isSeller ? (
        <Card style={styles.card}>
          <AppText variant="subheading">Secure handover</AppText>

          <AppText tone="secondary">
            Use a one-time PIN or QR code when the item changes hands. Only confirm the handover
            once the buyer has received the item.
          </AppText>

          <Pressable
            accessibilityRole="button"
            disabled={acting}
            onPress={() => {
              void generatePin();
            }}
            style={styles.actionButton}
          >
            <AppText variant="label">Generate collection PIN</AppText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={acting}
            onPress={() => {
              void generateQr();
            }}
            style={styles.actionButton}
          >
            <AppText variant="label">Generate QR code</AppText>
          </Pressable>
        </Card>
      ) : null}

      <Card style={styles.card}>
        <AppText variant="subheading">Handover activity</AppText>

        <AppText tone="secondary">Important updates for this transaction appear here.</AppText>

        {fulfilment.timeline.map((event) => (
          <View key={event.id} style={styles.timelineItem}>
            <AppText variant="label">
              {event.type
                .replaceAll('_', ' ')
                .toLowerCase()
                .replace(/^./, (value) => value.toUpperCase())}
            </AppText>

            <AppText variant="caption" tone="secondary">
              {new Date(event.createdAt).toLocaleString('en-GB')}
            </AppText>
          </View>
        ))}
      </Card>

      <Card style={styles.confirmCard}>
        {fulfilment.status === 'COMPLETED' ? (
          <>
            <AppText variant="subheading">Handover complete</AppText>

            <AppText tone="secondary">
              Both buyer and seller have confirmed the handover. This transaction is complete.
            </AppText>
          </>
        ) : currentUserConfirmed ? (
          <>
            <AppText variant="subheading">You have confirmed</AppText>

            <AppText tone="secondary">
              {otherPartyConfirmed
                ? 'Both parties have confirmed the handover.'
                : `Waiting for the ${isBuyer ? 'seller' : 'buyer'} to confirm the handover.`}
            </AppText>
          </>
        ) : (
          <>
            <AppText variant="subheading">Ready to finish?</AppText>

            <AppText tone="secondary">
              Confirm only when the item has been handed over or successfully delivered.
            </AppText>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Confirm handover"
              disabled={acting}
              onPress={() => {
                void confirm();
              }}
              style={styles.actionButton}
            >
              <AppText variant="label">Confirm handover</AppText>
            </Pressable>
          </>
        )}
      </Card>

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
    paddingBottom: 54,
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    gap: 6,
  },
  card: {
    gap: 12,
  },
  confirmCard: {
    gap: 12,
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
  timelineItem: {
    gap: 4,
    paddingVertical: 6,
  },
  error: {},
});
