import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppText, Card, Screen } from '../../../components';
import type { RootStackParamList } from '../../../navigation/routes';
import { useNeighbourTheme } from '../../../theme';

import { MARKETPLACE_CATEGORIES } from '../constants';
import { MarketplaceListingCard } from '../components/MarketplaceListingCard';
import { useMarketplaceListings } from '../hooks/useMarketplaceListings';

type Props = NativeStackScreenProps<RootStackParamList, 'MarketplaceListings'>;

export default function MarketplaceListingsScreen({ navigation }: Props) {
  const { theme } = useNeighbourTheme();
  const listings = useMarketplaceListings();

  return (
    <Screen
      contentStyle={styles.screen}
      refreshControl={
        <RefreshControl
          refreshing={listings.refreshing}
          onRefresh={() => {
            void listings.refresh();
          }}
          tintColor={theme.colors.primary}
        />
      }
    >
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

        <View style={styles.heading}>
          <AppText variant="overline" tone="brand">
            Neighbour Marketplace™
          </AppText>

          <AppText variant="title">Community Listings</AppText>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            navigation.navigate('CreateMarketplaceListing');
          }}
          style={[
            styles.primaryAction,
            {
              backgroundColor: theme.colors.primary,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <AppText variant="label" tone="inverse">
            + Sell an Item
          </AppText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            navigation.navigate('SavedMarketplaceListings');
          }}
          style={[
            styles.secondaryAction,
            {
              borderColor: theme.colors.borderStrong,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <AppText variant="label" tone="brand">
            Saved Listings
          </AppText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            navigation.navigate('MyMarketplaceListings');
          }}
          style={[
            styles.secondaryAction,
            {
              borderColor: theme.colors.borderStrong,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <AppText variant="label" tone="brand">
            My Listings
          </AppText>
        </Pressable>
      </View>

      <View
        style={[
          styles.search,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.borderStrong,
            borderRadius: theme.radius.xl,
          },
          theme.shadows.subtle,
        ]}
      >
        <AppText tone="brand" style={styles.searchSymbol}>
          ⌕
        </AppText>

        <TextInput
          accessibilityLabel="Search community listings"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={listings.setQuery}
          placeholder="Search nearby items"
          placeholderTextColor={theme.colors.textMuted}
          selectionColor={theme.colors.primary}
          style={[
            styles.searchInput,
            {
              color: theme.colors.text,
            },
          ]}
          value={listings.query}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.categories}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityState={{
            selected: listings.category === undefined,
          }}
          onPress={() => {
            listings.setCategory(undefined);
          }}
          style={[
            styles.category,
            {
              backgroundColor:
                listings.category === undefined ? theme.colors.primary : theme.colors.surface,
              borderColor:
                listings.category === undefined ? theme.colors.primary : theme.colors.border,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <AppText
            variant="caption"
            tone={listings.category === undefined ? 'inverse' : 'secondary'}
          >
            All
          </AppText>
        </Pressable>

        {MARKETPLACE_CATEGORIES.map((option) => {
          const selected = listings.category === option.value;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{
                selected,
              }}
              key={option.value}
              onPress={() => {
                listings.setCategory(option.value);
              }}
              style={[
                styles.category,
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

      <Pressable
        accessibilityRole="switch"
        accessibilityState={{
          checked: listings.freeOnly,
        }}
        onPress={() => {
          listings.setFreeOnly(!listings.freeOnly);
        }}
        style={[
          styles.freeToggle,
          {
            backgroundColor: listings.freeOnly
              ? theme.colors.primarySoft
              : theme.colors.surfaceMuted,
            borderColor: listings.freeOnly ? theme.colors.primary : theme.colors.border,
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        <View style={styles.freeCopy}>
          <AppText variant="bodyStrong">Free items only</AppText>

          <AppText variant="caption" tone="secondary">
            Show items being given away locally.
          </AppText>
        </View>

        <AppText variant="label" tone={listings.freeOnly ? 'brand' : 'muted'}>
          {listings.freeOnly ? 'On' : 'Off'}
        </AppText>
      </Pressable>

      {listings.error ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void listings.retry();
          }}
        >
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
              {listings.error}
            </AppText>

            <AppText variant="label" tone="brand">
              Tap to retry
            </AppText>
          </Card>
        </Pressable>
      ) : null}

      {listings.loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.colors.primary} size="large" />

          <AppText tone="secondary">Opening community listings…</AppText>
        </View>
      ) : listings.items.length > 0 ? (
        <>
          <View style={styles.grid}>
            {listings.items.map((listing) => (
              <MarketplaceListingCard
                key={listing.id}
                listing={listing}
                onPress={() => {
                  navigation.navigate('MarketplaceListingDetail', {
                    listingId: listing.id,
                  });
                }}
              />
            ))}
          </View>

          {listings.nextCursor ? (
            <Pressable
              accessibilityRole="button"
              disabled={listings.loadingMore}
              onPress={() => {
                void listings.loadMore();
              }}
              style={[
                styles.loadMore,
                {
                  borderColor: theme.colors.borderStrong,
                  borderRadius: theme.radius.pill,
                },
              ]}
            >
              {listings.loadingMore ? (
                <ActivityIndicator color={theme.colors.primary} />
              ) : (
                <AppText variant="label" tone="brand">
                  Load More
                </AppText>
              )}
            </Pressable>
          ) : null}
        </>
      ) : (
        <Card variant="muted" style={styles.empty}>
          <AppText variant="subheading">No listings found</AppText>

          <AppText tone="secondary">
            Try another search or be the first neighbour to list an item.
          </AppText>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 18,
    paddingBottom: 50,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 13,
  },
  heading: {
    flex: 1,
    gap: 4,
  },
  roundButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryAction: {
    alignItems: 'center',
    flex: 1.2,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 14,
  },
  secondaryAction: {
    alignItems: 'center',
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 14,
  },
  search: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 56,
    paddingHorizontal: 16,
  },
  searchSymbol: {
    fontSize: 21,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    minHeight: 52,
  },
  categories: {
    gap: 8,
  },
  category: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  freeToggle: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    padding: 13,
  },
  freeCopy: {
    flex: 1,
    gap: 3,
  },
  errorCard: {
    gap: 8,
  },
  loading: {
    alignItems: 'center',
    gap: 13,
    paddingVertical: 52,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  loadMore: {
    alignItems: 'center',
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  empty: {
    gap: 8,
  },
});
