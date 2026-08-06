import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppText, Card, Screen } from '../components';
import { MarketplaceBusinessCard, useMarketplace } from '../features/marketplace';
import type { AppTabParamList } from '../navigation/routes';
import { useNeighbourTheme } from '../theme';

type MarketplaceScreenProps = BottomTabScreenProps<AppTabParamList, 'Marketplace'>;

export default function MarketplaceScreen({ navigation }: MarketplaceScreenProps) {
  const { theme } = useNeighbourTheme();
  const marketplace = useMarketplace();

  return (
    <Screen
      contentStyle={styles.screen}
      refreshControl={
        <RefreshControl
          refreshing={marketplace.refreshing}
          onRefresh={() => {
            void marketplace.refresh();
          }}
          tintColor={theme.colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <AppText variant="overline" tone="brand">
          Neighbour Marketplace™
        </AppText>

        <AppText variant="title">Discover local businesses</AppText>

        <AppText variant="bodyLarge" tone="secondary">
          Find trusted businesses, offers and events connected to your communities.
        </AppText>
      </View>

      <View style={styles.marketplaceModes}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            navigation.getParent()?.navigate('MarketplaceOffers');
          }}
          style={styles.marketplaceMode}
        >
          <AppText variant="subheading">Offers & Transactions</AppText>

          <AppText tone="secondary">Review offers you have sent and received.</AppText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            navigation.getParent()?.navigate('MarketplaceListings');
          }}
          style={[
            styles.marketplaceMode,
            {
              backgroundColor: theme.colors.primary,
              borderRadius: theme.radius.xl,
            },
          ]}
        >
          <AppText variant="subheading" tone="inverse">
            Community Listings
          </AppText>

          <AppText variant="caption" tone="inverse">
            Buy, sell, give away and discover local items.
          </AppText>

          <AppText variant="label" tone="inverse">
            Open Listings ›
          </AppText>
        </Pressable>

        <Card variant="muted" style={styles.marketplaceMode}>
          <AppText variant="subheading">Local Businesses</AppText>

          <AppText variant="caption" tone="secondary">
            Browse trusted businesses, offers and events below.
          </AppText>
        </Card>
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
        <AppText tone="brand" style={styles.searchIcon}>
          ⌕
        </AppText>

        <TextInput
          accessibilityLabel="Search businesses"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={marketplace.setQuery}
          placeholder="Search businesses or categories"
          placeholderTextColor={theme.colors.textMuted}
          selectionColor={theme.colors.primary}
          style={[
            styles.input,
            {
              color: theme.colors.text,
            },
          ]}
          value={marketplace.query}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.categories}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {marketplace.categories.map((category) => {
          const selected = marketplace.category === category;

          return (
            <Pressable
              key={category}
              accessibilityRole="button"
              accessibilityState={{
                selected,
              }}
              onPress={() => {
                marketplace.setCategory(category);
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
                {category}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      {marketplace.error ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void marketplace.retry();
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
              {marketplace.error}
            </AppText>

            <AppText variant="label" tone="brand">
              Tap to retry
            </AppText>
          </Card>
        </Pressable>
      ) : null}

      {marketplace.myBusiness ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText variant="subheading">My Business</AppText>

            <AppText variant="caption" tone="brand">
              Owner dashboard
            </AppText>
          </View>

          <MarketplaceBusinessCard
            business={marketplace.myBusiness}
            onPress={() => {
              navigation.getParent()?.navigate('BusinessDetail', {
                business: marketplace.myBusiness!,
              });
            }}
          />
        </View>
      ) : null}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <AppText variant="subheading">Businesses</AppText>

          <AppText variant="caption" tone="secondary">
            {marketplace.businesses.length}
          </AppText>
        </View>

        {marketplace.loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={theme.colors.primary} size="large" />

            <AppText tone="secondary">Opening Marketplace…</AppText>
          </View>
        ) : marketplace.businesses.length ? (
          <View style={styles.cards}>
            {marketplace.businesses.map((business) => (
              <MarketplaceBusinessCard
                key={business.id}
                business={business}
                onPress={() => {
                  navigation.getParent()?.navigate('BusinessDetail', {
                    business,
                  });
                }}
              />
            ))}
          </View>
        ) : (
          <Card variant="muted" style={styles.empty}>
            <AppText variant="subheading">No businesses found</AppText>

            <AppText tone="secondary">Try another search or category.</AppText>
          </Card>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 22,
    paddingBottom: 48,
  },
  header: {
    gap: 9,
  },
  marketplaceModes: {
    gap: 10,
  },
  marketplaceMode: {
    gap: 7,
    minHeight: 118,
    justifyContent: 'center',
  },
  search: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 56,
    paddingHorizontal: 16,
  },
  searchIcon: {
    fontSize: 21,
  },
  input: {
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
  errorCard: {
    gap: 8,
  },
  section: {
    gap: 13,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  loading: {
    alignItems: 'center',
    gap: 13,
    paddingVertical: 50,
  },
  cards: {
    gap: 12,
  },
  empty: {
    gap: 8,
  },
});
