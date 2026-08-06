import {
  getMarketplaceListing,
  toggleMarketplaceListingSaved,
  type MarketplaceListing,
} from '@neighbour/api-client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useCallback, useEffect, useState } from 'react';

import { AppText, Card, Screen } from '../../../components';
import { MediaGallery } from '../../media';
import type { RootStackParamList } from '../../../navigation/routes';
import { useNeighbourTheme } from '../../../theme';

import {
  formatMarketplacePrice,
  marketplaceCategoryLabel,
  marketplaceConditionLabel,
} from '../constants';

type Props = NativeStackScreenProps<RootStackParamList, 'MarketplaceListingDetail'>;

export default function MarketplaceListingDetailScreen({ navigation, route }: Props) {
  const { theme } = useNeighbourTheme();

  const [listing, setListing] = useState<MarketplaceListing | null>(null);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setListing(await getMarketplaceListing(route.params.listingId));
    } catch {
      setError('This listing could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [route.params.listingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleSaved = async () => {
    if (!listing || saving) {
      return;
    }

    setSaving(true);

    try {
      const result = await toggleMarketplaceListingSaved(listing.id);

      setListing({
        ...listing,
        saved: result.saved,
        savedCount: result.savedCount,
      });
    } catch {
      setError('The saved-listing status could not be changed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Screen contentStyle={styles.loading}>
        <ActivityIndicator color={theme.colors.primary} size="large" />

        <AppText tone="secondary">Opening listing…</AppText>
      </Screen>
    );
  }

  if (!listing || error) {
    return (
      <Screen contentStyle={styles.screen}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            navigation.goBack();
          }}
        >
          <AppText variant="label" tone="brand">
            ‹ Back
          </AppText>
        </Pressable>

        <Card variant="muted" style={styles.errorCard}>
          <AppText variant="subheading">Listing unavailable</AppText>

          <AppText tone="secondary">{error ?? 'This listing no longer exists.'}</AppText>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void load();
            }}
          >
            <AppText variant="label" tone="brand">
              Try Again
            </AppText>
          </Pressable>
        </Card>
      </Screen>
    );
  }

  const galleryItems = listing.media.map((item) => ({
    ...item,
    asset: {
      ...item.asset,
      ownerId: listing.seller.id,
      storageKey: '',
      sizeBytes: 0,
      durationMs: null,
      status: 'READY' as const,
      uploadedAt: null,
      readyAt: null,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
    },
  }));

  return (
    <Screen contentStyle={styles.screen}>
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

        <View style={styles.topSpacer} />

        <Pressable
          accessibilityRole="button"
          disabled={saving}
          onPress={() => {
            void toggleSaved();
          }}
          style={[
            styles.saveButton,
            {
              backgroundColor: listing.saved ? theme.colors.primarySoft : theme.colors.surfaceMuted,
              borderColor: listing.saved ? theme.colors.primary : theme.colors.border,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <AppText variant="label" tone={listing.saved ? 'brand' : 'secondary'}>
            {listing.saved ? '♥ Saved' : '♡ Save'}
          </AppText>
        </Pressable>
      </View>

      <MediaGallery items={galleryItems} />

      <View style={styles.heading}>
        <AppText variant="overline" tone="brand">
          {marketplaceCategoryLabel(listing.category)}
        </AppText>

        <AppText variant="title">{listing.title}</AppText>

        <AppText variant="heading" tone="brand">
          {formatMarketplacePrice(listing.pricePence, listing.isFree)}
        </AppText>
      </View>

      <View style={styles.badges}>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <AppText variant="caption">{marketplaceConditionLabel(listing.condition)}</AppText>
        </View>

        {listing.acceptsOffers ? (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: theme.colors.primarySoft,
                borderRadius: theme.radius.pill,
              },
            ]}
          >
            <AppText variant="caption" tone="brand">
              Offers accepted
            </AppText>
          </View>
        ) : null}
      </View>

      <Card style={styles.descriptionCard}>
        <AppText variant="subheading">Description</AppText>

        <AppText tone="secondary">{listing.description}</AppText>
      </Card>

      <Card style={styles.deliveryCard}>
        <AppText variant="subheading">Receiving the Item</AppText>

        {listing.collectionAvailable ? (
          <AppText tone="secondary">✓ Collection available</AppText>
        ) : null}

        {listing.deliveryAvailable ? (
          <AppText tone="secondary">✓ Local delivery available</AppText>
        ) : null}

        {listing.postageAvailable ? <AppText tone="secondary">✓ Postage available</AppText> : null}

        <AppText variant="caption" tone="muted">
          {listing.localArea ?? listing.postcodeDistrict ?? 'Location available from the seller'}
        </AppText>
      </Card>

      <Card style={styles.sellerCard}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: theme.colors.primarySoft,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <AppText variant="subheading" tone="brand">
            {listing.seller.displayName.slice(0, 1).toUpperCase()}
          </AppText>
        </View>

        <View style={styles.sellerCopy}>
          <AppText variant="bodyStrong">{listing.seller.displayName}</AppText>

          <AppText variant="caption" tone="secondary">
            {listing.seller.username ? `@${listing.seller.username}` : 'Neighbour seller'}
          </AppText>

          <AppText variant="caption" tone="muted">
            {listing.viewCount} views · {listing.savedCount} saved
          </AppText>
        </View>
      </Card>

      <Pressable
        accessibilityRole="button"
        onPress={() => {
          setError('Seller messaging will open through MessagingOS in the next marketplace push.');
        }}
        style={[
          styles.contactButton,
          {
            backgroundColor: theme.colors.primary,
            borderRadius: theme.radius.pill,
          },
        ]}
      >
        <AppText variant="label" tone="inverse">
          Contact Seller
        </AppText>
      </Pressable>

      {error ? (
        <Card
          variant="muted"
          style={[
            styles.inlineError,
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
    flex: 1,
    gap: 14,
    justifyContent: 'center',
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  topSpacer: {
    flex: 1,
  },
  roundButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  saveButton: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  heading: {
    gap: 7,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  descriptionCard: {
    gap: 9,
  },
  deliveryCard: {
    gap: 8,
  },
  sellerCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 13,
  },
  avatar: {
    alignItems: 'center',
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  sellerCopy: {
    flex: 1,
    gap: 3,
  },
  contactButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  errorCard: {
    gap: 10,
  },
  inlineError: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
