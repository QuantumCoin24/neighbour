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

          <AppText variant="title">Buy, sell & give locally</AppText>

          <AppText variant="caption" tone="secondary">
            Discover useful things from people in your community.
          </AppText>
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
            + Sell an item
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
            Saved
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
            Selling
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
          placeholder="Search Marketplace"
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
          <AppText variant="bodyStrong">Free only</AppText>

          <AppText variant="caption" tone="secondary">
            Show items neighbours are giving away.
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
                  Show more listings
                </AppText>
              )}
            </Pressable>
          ) : null}
        </>
      ) : (
        <Card variant="muted" style={styles.empty}>
          <AppText variant="subheading">Nothing here yet</AppText>

          <AppText tone="secondary">
            Try another search, change your filters or list something for your neighbours.
          </AppText>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 16,
    paddingBottom: 56,
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
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryAction: {
    alignItems: 'center',
    flex: 1.25,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 13,
  },
  secondaryAction: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    flex: 0.82,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 11,
  },
  search: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 15,
  },
  searchSymbol: {
    fontSize: 21,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    minHeight: 48,
  },
  categories: {
    gap: 8,
  },
  category: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  freeToggle: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
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
    gap: 12,
    justifyContent: 'space-between',
  },
  loadMore: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 46,
    marginTop: 4,
  },
  empty: {
    gap: 8,
  },
});
