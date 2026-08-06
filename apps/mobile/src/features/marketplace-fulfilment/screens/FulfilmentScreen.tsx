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

type Props = NativeStackScreenProps<RootStackParamList, 'MarketplaceFulfilment'>;

export default function FulfilmentScreen({ route }: Props) {
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
        caughtError instanceof Error ? caughtError.message : 'Fulfilment could not be created.',
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
        caughtError instanceof Error ? caughtError.message : 'Collection could not be scheduled.',
      );
    } finally {
      setActing(false);
    }
  };

  const saveDelivery = async () => {
    if (!fulfilment) {
      return;
    }

    setActing(true);
    setError(null);

    try {
      setFulfilment(
        await createMarketplaceDelivery(fulfilment.id, {
          addressLine1,
          city,
          postcode,
          ...(courier.trim()
            ? {
                courier: courier.trim(),
              }
            : {}),
          ...(trackingNumber.trim()
            ? {
                trackingNumber: trackingNumber.trim(),
              }
            : {}),
        }),
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : 'Delivery could not be configured.',
      );
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

      Alert.alert('QR handover token', result.token);
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
          FulfilmentOS
        </AppText>

        <AppText variant="title">Choose Fulfilment</AppText>

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
                <AppText variant="label">{method.replaceAll('_', ' ')}</AppText>
              </Pressable>
            ),
          )}
        </Card>

        {error ? <AppText style={styles.error}>{error}</AppText> : null}
      </Screen>
    );
  }

  const isSeller = route.params.sellerId === user?.id;

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.heading}>
        <AppText variant="overline" tone="brand">
          FulfilmentOS
        </AppText>

        <AppText variant="title">{fulfilment.method.replaceAll('_', ' ')}</AppText>

        <AppText tone="secondary">Status: {fulfilment.status.replaceAll('_', ' ')}</AppText>
      </View>

      {isSeller && fulfilment.method === 'COLLECTION' ? (
        <Card style={styles.card}>
          <AppText variant="subheading">Schedule Collection</AppText>

          <TextInput
            placeholder="Address line 1"
            value={addressLine1}
            onChangeText={setAddressLine1}
            style={styles.input}
          />

          <TextInput placeholder="City" value={city} onChangeText={setCity} style={styles.input} />

          <TextInput
            placeholder="Postcode"
            value={postcode}
            onChangeText={setPostcode}
            style={styles.input}
          />

          <TextInput
            placeholder="2026-08-10T14:00:00.000Z"
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
            <AppText variant="label">Save Collection</AppText>
          </Pressable>
        </Card>
      ) : null}

      {isSeller && fulfilment.method !== 'COLLECTION' ? (
        <Card style={styles.card}>
          <AppText variant="subheading">Configure Delivery</AppText>

          <TextInput
            placeholder="Address line 1"
            value={addressLine1}
            onChangeText={setAddressLine1}
            style={styles.input}
          />

          <TextInput placeholder="City" value={city} onChangeText={setCity} style={styles.input} />

          <TextInput
            placeholder="Postcode"
            value={postcode}
            onChangeText={setPostcode}
            style={styles.input}
          />

          <TextInput
            placeholder="Courier"
            value={courier}
            onChangeText={setCourier}
            style={styles.input}
          />

          <TextInput
            placeholder="Tracking number"
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
            <AppText variant="label">Save Delivery</AppText>
          </Pressable>
        </Card>
      ) : null}

      {isSeller ? (
        <Card style={styles.card}>
          <AppText variant="subheading">Handover Verification</AppText>

          <Pressable
            accessibilityRole="button"
            disabled={acting}
            onPress={() => {
              void generatePin();
            }}
            style={styles.actionButton}
          >
            <AppText variant="label">Generate PIN</AppText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={acting}
            onPress={() => {
              void generateQr();
            }}
            style={styles.actionButton}
          >
            <AppText variant="label">Generate QR Token</AppText>
          </Pressable>
        </Card>
      ) : null}

      <Card style={styles.card}>
        <AppText variant="subheading">Timeline</AppText>

        {fulfilment.timeline.map((event) => (
          <View key={event.id} style={styles.timelineItem}>
            <AppText variant="label">{event.type.replaceAll('_', ' ')}</AppText>

            <AppText variant="caption" tone="secondary">
              {new Date(event.createdAt).toLocaleString('en-GB')}
            </AppText>
          </View>
        ))}
      </Card>

      <Pressable
        accessibilityRole="button"
        disabled={acting}
        onPress={() => {
          void confirm();
        }}
        style={styles.actionButton}
      >
        <AppText variant="label">Confirm Fulfilment</AppText>
      </Pressable>

      {acting ? <ActivityIndicator /> : null}

      {error ? <AppText style={styles.error}>{error}</AppText> : null}
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
  error: {
    color: '#b42318',
  },
});
