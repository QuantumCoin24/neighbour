import {
  ApiClientError,
  createMarketplaceListing,
  type MarketplaceListingCategory,
  type MarketplaceListingCondition,
  type MarketplaceListingStatus,
} from '@neighbour/api-client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useMemo, useState } from 'react';

import { AppText, Card, Screen } from '../../../components';
import { MediaPicker, type PendingMedia, useMediaUpload } from '../../media';
import type { RootStackParamList } from '../../../navigation/routes';
import { useNeighbourTheme } from '../../../theme';

import { MARKETPLACE_CATEGORIES, MARKETPLACE_CONDITIONS } from '../constants';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateMarketplaceListing'>;

export default function CreateMarketplaceListingScreen({ navigation }: Props) {
  const { theme } = useNeighbourTheme();

  const mediaUpload = useMediaUpload();

  const [title, setTitle] = useState('');

  const [description, setDescription] = useState('');

  const [category, setCategory] = useState<MarketplaceListingCategory>('OTHER');

  const [condition, setCondition] = useState<MarketplaceListingCondition>('GOOD');

  const [price, setPrice] = useState('');

  const [isFree, setIsFree] = useState(false);

  const [acceptsOffers, setAcceptsOffers] = useState(false);

  const [collectionAvailable, setCollectionAvailable] = useState(true);

  const [deliveryAvailable, setDeliveryAvailable] = useState(false);

  const [postageAvailable, setPostageAvailable] = useState(false);

  const [localArea, setLocalArea] = useState('');

  const [postcodeDistrict, setPostcodeDistrict] = useState('');

  const [media, setMedia] = useState<PendingMedia[]>([]);

  const [publishing, setPublishing] = useState(false);

  const [savingDraft, setSavingDraft] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const busy = publishing || savingDraft || mediaUpload.uploading;

  const pricePence = useMemo(() => {
    if (isFree) {
      return undefined;
    }

    const parsed = Number.parseFloat(price.trim());

    if (!Number.isFinite(parsed) || parsed < 0) {
      return undefined;
    }

    return Math.round(parsed * 100);
  }, [isFree, price]);

  const submit = async (status: MarketplaceListingStatus) => {
    if (busy) {
      return;
    }

    if (title.trim().length < 3) {
      setError('Add a clear listing title.');
      return;
    }

    if (description.trim().length < 10) {
      setError('Add a fuller item description.');
      return;
    }

    if (!isFree && pricePence === undefined) {
      setError('Enter a valid price or mark the item as free.');
      return;
    }

    if (!collectionAvailable && !deliveryAvailable && !postageAvailable) {
      setError('Select at least one way for the buyer to receive the item.');
      return;
    }

    if (status === 'PUBLISHED') {
      setPublishing(true);
    } else {
      setSavingDraft(true);
    }

    setError(null);

    try {
      const uploadedMedia = media.length > 0 ? await mediaUpload.upload(media) : [];

      const listing = await createMarketplaceListing({
        title: title.trim(),
        description: description.trim(),
        category,
        condition,
        status,
        isFree,
        acceptsOffers,
        collectionAvailable,
        deliveryAvailable,
        postageAvailable,
        ...(pricePence !== undefined
          ? {
              pricePence,
            }
          : {}),
        ...(localArea.trim()
          ? {
              localArea: localArea.trim(),
            }
          : {}),
        ...(postcodeDistrict.trim()
          ? {
              postcodeDistrict: postcodeDistrict.trim().toUpperCase(),
            }
          : {}),
        ...(uploadedMedia.length > 0
          ? {
              mediaIds: uploadedMedia.map((item) => item.asset.id),
            }
          : {}),
      });

      navigation.replace('MarketplaceListingDetail', {
        listingId: listing.id,
      });
    } catch (caughtError) {
      if (caughtError instanceof ApiClientError) {
        setError(caughtError.message);
      } else if (caughtError instanceof Error) {
        setError(caughtError.message);
      } else {
        setError('The listing could not be saved.');
      }
    } finally {
      setPublishing(false);
      setSavingDraft(false);
    }
  };

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          disabled={busy}
          onPress={() => {
            navigation.goBack();
          }}
          style={[
            styles.roundButton,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderRadius: theme.radius.pill,
              opacity: busy ? 0.5 : 1,
            },
          ]}
        >
          <AppText variant="subheading">‹</AppText>
        </Pressable>

        <View style={styles.heading}>
          <AppText variant="overline" tone="brand">
            Neighbour Marketplace™
          </AppText>

          <AppText variant="title">Create a listing</AppText>

          <AppText variant="caption" tone="secondary">
            Sell or give something to people nearby.
          </AppText>
        </View>
      </View>

      <MediaPicker
        disabled={busy}
        items={media}
        maximum={9}
        onChange={(items) => {
          setMedia(items);
          setError(null);
        }}
      />

      <View style={styles.field}>
        <AppText variant="label">Listing title</AppText>

        <TextInput
          editable={!busy}
          maxLength={120}
          onChangeText={setTitle}
          placeholder="What are you selling?"
          placeholderTextColor={theme.colors.textMuted}
          selectionColor={theme.colors.primary}
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.borderStrong,
              borderRadius: theme.radius.lg,
              color: theme.colors.text,
            },
          ]}
          value={title}
        />
      </View>

      <View style={styles.field}>
        <AppText variant="label">Description</AppText>

        <TextInput
          editable={!busy}
          maxLength={5000}
          multiline
          onChangeText={setDescription}
          placeholder="Describe the item, its condition and anything a buyer should know."
          placeholderTextColor={theme.colors.textMuted}
          selectionColor={theme.colors.primary}
          style={[
            styles.description,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.borderStrong,
              borderRadius: theme.radius.lg,
              color: theme.colors.text,
            },
          ]}
          textAlignVertical="top"
          value={description}
        />
      </View>

      <View style={styles.field}>
        <AppText variant="label">Category</AppText>

        <ScrollView
          contentContainerStyle={styles.optionRow}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {MARKETPLACE_CATEGORIES.map((option) => {
            const selected = category === option.value;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{
                  selected,
                }}
                disabled={busy}
                key={option.value}
                onPress={() => {
                  setCategory(option.value);
                }}
                style={[
                  styles.option,
                  {
                    backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
                    borderColor: selected ? theme.colors.primary : theme.colors.border,
                    borderRadius: theme.radius.pill,
                  },
                ]}
              >
                <AppText variant="caption" tone={selected ? 'inverse' : 'secondary'}>
                  {option.symbol} {option.label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.field}>
        <AppText variant="label">Condition</AppText>

        <ScrollView
          contentContainerStyle={styles.optionRow}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {MARKETPLACE_CONDITIONS.map((option) => {
            const selected = condition === option.value;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{
                  selected,
                }}
                disabled={busy}
                key={option.value}
                onPress={() => {
                  setCondition(option.value);
                }}
                style={[
                  styles.option,
                  {
                    backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
                    borderColor: selected ? theme.colors.primary : theme.colors.border,
                    borderRadius: theme.radius.pill,
                  },
                ]}
              >
                <AppText variant="caption" tone={selected ? 'inverse' : 'secondary'}>
                  {option.label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <Card style={styles.priceCard}>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{
            checked: isFree,
          }}
          disabled={busy}
          onPress={() => {
            setIsFree(!isFree);
          }}
          style={styles.switchRow}
        >
          <View style={styles.switchCopy}>
            <AppText variant="bodyStrong">Give away for free</AppText>

            <AppText variant="caption" tone="secondary">
              No payment required.
            </AppText>
          </View>

          <AppText variant="label" tone={isFree ? 'brand' : 'muted'}>
            {isFree ? 'On' : 'Off'}
          </AppText>
        </Pressable>

        {!isFree ? (
          <View style={styles.field}>
            <AppText variant="label">Price</AppText>

            <View
              style={[
                styles.priceInput,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.borderStrong,
                  borderRadius: theme.radius.lg,
                },
              ]}
            >
              <AppText variant="subheading" tone="brand">
                £
              </AppText>

              <TextInput
                editable={!busy}
                keyboardType="decimal-pad"
                onChangeText={setPrice}
                placeholder="0.00"
                placeholderTextColor={theme.colors.textMuted}
                selectionColor={theme.colors.primary}
                style={[
                  styles.priceText,
                  {
                    color: theme.colors.text,
                  },
                ]}
                value={price}
              />
            </View>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="switch"
          accessibilityState={{
            checked: acceptsOffers,
          }}
          disabled={busy || isFree}
          onPress={() => {
            setAcceptsOffers(!acceptsOffers);
          }}
          style={[
            styles.switchRow,
            {
              opacity: isFree ? 0.45 : 1,
            },
          ]}
        >
          <View style={styles.switchCopy}>
            <AppText variant="bodyStrong">Accept offers</AppText>

            <AppText variant="caption" tone="secondary">
              Buyers may suggest another price.
            </AppText>
          </View>

          <AppText variant="label" tone={acceptsOffers ? 'brand' : 'muted'}>
            {acceptsOffers ? 'On' : 'Off'}
          </AppText>
        </Pressable>
      </Card>

      <Card style={styles.deliveryCard}>
        <AppText variant="subheading">Collection & delivery</AppText>

        {[
          {
            label: 'Collection',
            description: 'Buyer collects locally.',
            value: collectionAvailable,
            setValue: setCollectionAvailable,
          },
          {
            label: 'Local delivery',
            description: 'You can deliver nearby.',
            value: deliveryAvailable,
            setValue: setDeliveryAvailable,
          },
          {
            label: 'Postage',
            description: 'The item can be posted.',
            value: postageAvailable,
            setValue: setPostageAvailable,
          },
        ].map((option) => (
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{
              checked: option.value,
            }}
            disabled={busy}
            key={option.label}
            onPress={() => {
              option.setValue(!option.value);
            }}
            style={styles.switchRow}
          >
            <View style={styles.switchCopy}>
              <AppText variant="bodyStrong">{option.label}</AppText>

              <AppText variant="caption" tone="secondary">
                {option.description}
              </AppText>
            </View>

            <AppText variant="label" tone={option.value ? 'brand' : 'muted'}>
              {option.value ? 'On' : 'Off'}
            </AppText>
          </Pressable>
        ))}
      </Card>

      <View style={styles.locationRow}>
        <View style={[styles.field, styles.locationField]}>
          <AppText variant="label">Local area</AppText>

          <TextInput
            editable={!busy}
            maxLength={100}
            onChangeText={setLocalArea}
            placeholder="Blackley"
            placeholderTextColor={theme.colors.textMuted}
            selectionColor={theme.colors.primary}
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.borderStrong,
                borderRadius: theme.radius.lg,
                color: theme.colors.text,
              },
            ]}
            value={localArea}
          />
        </View>

        <View style={[styles.field, styles.locationField]}>
          <AppText variant="label">Postcode district</AppText>

          <TextInput
            autoCapitalize="characters"
            editable={!busy}
            maxLength={4}
            onChangeText={setPostcodeDistrict}
            placeholder="M9"
            placeholderTextColor={theme.colors.textMuted}
            selectionColor={theme.colors.primary}
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.borderStrong,
                borderRadius: theme.radius.lg,
                color: theme.colors.text,
              },
            ]}
            value={postcodeDistrict}
          />
        </View>
      </View>

      {mediaUpload.uploading ? (
        <Card variant="muted" style={styles.uploadCard}>
          <AppText variant="bodyStrong">Uploading photos</AppText>

          <AppText variant="caption" tone="secondary">
            {Math.round(mediaUpload.overallProgress * 100)}% complete
          </AppText>
        </Card>
      ) : null}

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

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => {
            void submit('DRAFT');
          }}
          style={[
            styles.secondaryAction,
            {
              borderColor: theme.colors.borderStrong,
              borderRadius: theme.radius.pill,
              opacity: busy ? 0.6 : 1,
            },
          ]}
        >
          {savingDraft ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : (
            <AppText variant="label" tone="brand">
              Save draft
            </AppText>
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => {
            void submit('PUBLISHED');
          }}
          style={[
            styles.primaryAction,
            {
              backgroundColor: theme.colors.primary,
              borderRadius: theme.radius.pill,
              opacity: busy ? 0.6 : 1,
            },
          ]}
        >
          {publishing ? (
            <ActivityIndicator color={theme.colors.inverseText} />
          ) : (
            <AppText variant="label" tone="inverse">
              Publish listing
            </AppText>
          )}
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 17,
    paddingBottom: 60,
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
  field: {
    gap: 8,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  description: {
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 16,
    lineHeight: 23,
    minHeight: 150,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  optionRow: {
    gap: 8,
  },
  option: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  priceCard: {
    gap: 15,
  },
  priceInput: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 7,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  priceText: {
    flex: 1,
    fontSize: 17,
    minHeight: 48,
  },
  deliveryCard: {
    gap: 15,
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  switchCopy: {
    flex: 1,
    gap: 3,
  },
  locationRow: {
    flexDirection: 'row',
    gap: 10,
  },
  locationField: {
    flex: 1,
  },
  uploadCard: {
    gap: 5,
  },
  errorCard: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryAction: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    justifyContent: 'center',
    minHeight: 50,
  },
  primaryAction: {
    alignItems: 'center',
    flex: 1.25,
    justifyContent: 'center',
    minHeight: 50,
  },
});
