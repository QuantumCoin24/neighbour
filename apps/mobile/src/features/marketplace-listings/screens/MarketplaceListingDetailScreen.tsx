import {
  unblockSocialGraphUser,
  createSecurityReport,
  blockSocialGraphUser,
  ApiClientError,
  sendMessage,
  createConversation,
  getMarketplaceListing,
  toggleMarketplaceListingSaved,
  type MarketplaceListing,
} from '@neighbour/api-client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../../../auth/auth-context';
import { getSessionAccessToken } from '../../../auth/session';
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
  const { user } = useAuth();

  const [listing, setListing] = useState<MarketplaceListing | null>(null);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [contacting, setContacting] = useState(false);

  const [reporting, setReporting] = useState(false);

  const [blocking, setBlocking] = useState(false);

  const [sellerBlocked, setSellerBlocked] = useState(false);

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

  const contactSeller = async () => {
    if (!listing || !user || contacting || listing.seller.id === user.id) {
      return;
    }

    setContacting(true);
    setError(null);

    try {
      const conversation = await createConversation({
        type: 'DIRECT',
        memberIds: [listing.seller.id],
      });

      if (!conversation.lastMessage) {
        await sendMessage(conversation.id, {
          content: `Hi, I am interested in your marketplace listing: ${listing.title}`,
          clientNonce: `marketplace-${listing.id}-${user.id}`,
          metadata: {
            source: 'MARKETPLACE_LISTING',
            listingId: listing.id,
            listingTitle: listing.title,
            listingPricePence: listing.pricePence,
            listingIsFree: listing.isFree,
            listingCategory: listing.category,
            sellerId: listing.seller.id,
            imageUrl: listing.media[0]?.asset.url ?? null,
          },
        });
      }

      navigation.navigate('Conversation', {
        conversationId: conversation.id,
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'The seller conversation could not be opened.',
      );
    } finally {
      setContacting(false);
    }
  };

  const submitListingReport = async (reason: string) => {
    if (!listing || reporting) {
      return;
    }

    const token = getSessionAccessToken();

    if (!token) {
      setError('Your session has expired. Please sign in again.');
      return;
    }

    setReporting(true);
    setError(null);

    try {
      await createSecurityReport(token, {
        targetType: 'MARKETPLACE_LISTING',
        targetId: listing.id,
        reason,
        description: `Marketplace listing: ${listing.title}`,
      });

      Alert.alert('Report submitted', 'Neighbour’s moderation team will review this listing.');
    } catch (caughtError) {
      if (caughtError instanceof ApiClientError && caughtError.status === 409) {
        setError('You have already submitted an active report for this listing.');
      } else {
        setError(
          caughtError instanceof Error ? caughtError.message : 'The report could not be submitted.',
        );
      }
    } finally {
      setReporting(false);
    }
  };

  const openReportMenu = () => {
    Alert.alert('Report Listing', 'Why are you reporting this listing?', [
      {
        text: 'Suspected scam',
        onPress: () => {
          void submitListingReport('SUSPECTED_SCAM');
        },
      },
      {
        text: 'Prohibited item',
        onPress: () => {
          void submitListingReport('PROHIBITED_ITEM');
        },
      },
      {
        text: 'Misleading information',
        onPress: () => {
          void submitListingReport('MISLEADING_INFORMATION');
        },
      },
      {
        text: 'Harassment or abuse',
        onPress: () => {
          void submitListingReport('HARASSMENT_OR_ABUSE');
        },
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  const reportSeller = async () => {
    if (!listing || reporting) {
      return;
    }

    const token = getSessionAccessToken();

    if (!token) {
      setError('Your session has expired. Please sign in again.');
      return;
    }

    setReporting(true);
    setError(null);

    try {
      await createSecurityReport(token, {
        targetType: 'USER',
        targetId: listing.seller.id,
        reason: 'MARKETPLACE_SELLER_CONDUCT',
        description: `Seller connected to listing: ${listing.title}`,
      });

      Alert.alert('Seller reported', 'The report has been sent to Neighbour’s moderation team.');
    } catch (caughtError) {
      if (caughtError instanceof ApiClientError && caughtError.status === 409) {
        setError('You have already submitted an active report for this seller.');
      } else {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : 'The seller report could not be submitted.',
        );
      }
    } finally {
      setReporting(false);
    }
  };

  const toggleSellerBlock = async () => {
    if (!listing || blocking || listing.seller.id === user?.id) {
      return;
    }

    setBlocking(true);
    setError(null);

    try {
      if (sellerBlocked) {
        await unblockSocialGraphUser(listing.seller.id);

        setSellerBlocked(false);

        Alert.alert('Seller unblocked', 'Their listings may appear in Marketplace again.');
      } else {
        await blockSocialGraphUser(listing.seller.id);

        setSellerBlocked(true);

        Alert.alert('Seller blocked', 'Their listings will no longer appear in Marketplace.');
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'The seller block could not be changed.',
      );
    } finally {
      setBlocking(false);
    }
  };

  const openSafetyMenu = () => {
    if (!listing || listing.seller.id === user?.id) {
      return;
    }

    Alert.alert('Listing Safety', 'Choose an action.', [
      {
        text: 'Report Listing',
        onPress: openReportMenu,
      },
      {
        text: 'Report Seller',
        onPress: () => {
          void reportSeller();
        },
      },
      {
        text: sellerBlocked ? 'Unblock Seller' : 'Block Seller',
        style: sellerBlocked ? 'default' : 'destructive',
        onPress: () => {
          void toggleSellerBlock();
        },
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
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
              Try again
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

      {listing.status === 'RESERVED' ? (
        <Card variant="muted" style={styles.lifecycleCard}>
          <AppText variant="label" tone="brand">
            Reserved
          </AppText>

          <AppText variant="caption" tone="secondary">
            This item is currently reserved for another neighbour.
          </AppText>
        </Card>
      ) : null}

      {listing.status === 'SOLD' ? (
        <Card variant="muted" style={styles.lifecycleCard}>
          <AppText variant="label">Sold</AppText>

          <AppText variant="caption" tone="secondary">
            This item has been sold.
          </AppText>
        </Card>
      ) : null}

      <MediaGallery items={galleryItems} />

      <View style={styles.heading}>
        <AppText variant="overline" tone="brand">
          {marketplaceCategoryLabel(listing.category)}
        </AppText>

        <AppText variant="heading" tone="brand">
          {formatMarketplacePrice(listing.pricePence, listing.isFree)}
        </AppText>

        <AppText variant="title">{listing.title}</AppText>
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
        <AppText variant="subheading">Collection & delivery</AppText>

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

      <Card variant="muted" style={styles.safetyCard}>
        <AppText variant="subheading">Marketplace Safety</AppText>

        <AppText variant="caption" tone="secondary">
          Meet safely, inspect the item before paying and never share passwords or verification
          codes.
        </AppText>

        {listing.seller.id !== user?.id ? (
          <Pressable
            accessibilityRole="button"
            disabled={reporting || blocking}
            onPress={openSafetyMenu}
            style={[
              styles.safetyButton,
              {
                borderColor: theme.colors.borderStrong,
                borderRadius: theme.radius.pill,
              },
            ]}
          >
            {reporting || blocking ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              <AppText variant="label" tone="brand">
                Safety & reporting
              </AppText>
            )}
          </Pressable>
        ) : null}
      </Card>

      {listing.seller.id !== user?.id &&
      listing.status === 'PUBLISHED' &&
      listing.acceptsOffers &&
      !listing.isFree ? (
        <Card variant="muted" style={styles.offerCard}>
          <AppText variant="subheading">Make an offer</AppText>

          <AppText variant="caption" tone="secondary">
            Suggest a price to the seller. They can accept, decline or counter.
          </AppText>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              navigation.navigate('MakeMarketplaceOffer', {
                listingId: listing.id,
                listingTitle: listing.title,
                askingPricePence: listing.pricePence,
              });
            }}
            style={[
              styles.offerButton,
              {
                borderRadius: theme.radius.pill,
              },
            ]}
          >
            <AppText variant="label">Make an offer</AppText>
          </Pressable>
        </Card>
      ) : null}

      {listing.seller.id === user?.id && listing.acceptsOffers ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            navigation.navigate('MarketplaceOffers');
          }}
          style={[
            styles.ownerOfferButton,
            {
              borderColor: theme.colors.borderStrong,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <AppText variant="label" tone="brand">
            View offers
          </AppText>
        </Pressable>
      ) : null}

      {listing.seller.id === user?.id ? (
        <Card variant="muted" style={styles.ownerNotice}>
          <AppText variant="bodyStrong">This is your listing</AppText>

          <AppText variant="caption" tone="secondary">
            Manage this item from your selling dashboard.
          </AppText>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              navigation.navigate('MyMarketplaceListings');
            }}
          >
            <AppText variant="label" tone="brand">
              Open selling dashboard
            </AppText>
          </Pressable>
        </Card>
      ) : (
        <Pressable
          accessibilityRole="button"
          disabled={contacting}
          onPress={() => {
            void contactSeller();
          }}
          style={[
            styles.contactButton,
            {
              backgroundColor: theme.colors.primary,
              borderRadius: theme.radius.pill,
              opacity: contacting ? 0.65 : 1,
            },
          ]}
        >
          {contacting ? (
            <ActivityIndicator color={theme.colors.inverseText} />
          ) : (
            <AppText variant="label" tone="inverse">
              Message seller
            </AppText>
          )}
        </Pressable>
      )}

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
  offerCard: {
    gap: 10,
  },
  offerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 18,
  },
  ownerOfferButton: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 16,
  },
  lifecycleCard: {
    gap: 6,
  },

  screen: {
    gap: 16,
    paddingBottom: 58,
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
    gap: 5,
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
    gap: 8,
  },
  deliveryCard: {
    gap: 7,
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
  safetyCard: {
    gap: 10,
  },
  safetyButton: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 46,
  },
  ownerNotice: {
    gap: 8,
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
