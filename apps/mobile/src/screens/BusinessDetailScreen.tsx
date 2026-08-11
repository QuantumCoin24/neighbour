import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../auth/auth-context';
import { AppText, Card } from '../components';
import {
  MarketplaceEventCard,
  MarketplaceOfferCard,
  useBusinessDetail,
} from '../features/marketplace';
import type { RootStackParamList } from '../navigation/routes';
import { useNeighbourTheme } from '../theme';

type BusinessDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'BusinessDetail'>;

type BusinessSection = 'about' | 'offers' | 'events' | 'insights';

const SECTIONS: {
  id: BusinessSection;
  label: string;
}[] = [
  { id: 'about', label: 'About' },
  { id: 'offers', label: 'Offers' },
  { id: 'events', label: 'Events' },
  { id: 'insights', label: 'Insights' },
];

export default function BusinessDetailScreen({ navigation, route }: BusinessDetailScreenProps) {
  const { theme } = useNeighbourTheme();
  const { user } = useAuth();
  const detail = useBusinessDetail(route.params.business);
  const [section, setSection] = useState<BusinessSection>('about');

  const business = detail.dashboard?.business ?? route.params.business;
  const canManageBusiness = Boolean(user && business.ownerId === user.id);
  const hasFocusedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (hasFocusedRef.current) {
        void detail.refresh();
      } else {
        hasFocusedRef.current = true;
      }
    }, [detail.refresh]),
  );

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            navigation.goBack();
          }}
          style={[
            styles.back,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <AppText variant="bodyStrong">‹</AppText>
        </Pressable>

        <View style={styles.topCopy}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {business.name}
          </AppText>

          <AppText variant="caption" tone="secondary">
            {business.category}
          </AppText>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={detail.refreshing}
            onRefresh={() => {
              void detail.refresh();
            }}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Card
          style={[
            styles.hero,
            {
              backgroundColor: theme.colors.primaryStrong,
            },
          ]}
        >
          <View
            style={[
              styles.heroIcon,
              {
                backgroundColor: 'rgba(255,255,255,0.14)',
                borderRadius: theme.radius.xxl,
              },
            ]}
          >
            <AppText tone="inverse" style={styles.heroSymbol}>
              ▣
            </AppText>
          </View>

          <AppText variant="heading" tone="inverse">
            {business.name}
          </AppText>

          <AppText tone="inverse">{business.description}</AppText>

          <View style={styles.badges}>
            <View style={styles.badge}>
              <AppText variant="caption" tone="inverse">
                {business.category}
              </AppText>
            </View>

            {business.verified ? (
              <View style={styles.badge}>
                <AppText variant="caption" tone="inverse">
                  Verified ✓
                </AppText>
              </View>
            ) : null}
          </View>
        </Card>

        {canManageBusiness ? (
          <Pressable
            accessibilityLabel="Manage business"
            accessibilityRole="button"
            onPress={() => {
              navigation.navigate('EditBusiness', {
                business,
              });
            }}
            style={[
              styles.manageButton,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.radius.lg,
              },
            ]}
          >
            <View style={styles.manageCopy}>
              <AppText variant="bodyStrong" tone="inverse">
                Manage business
              </AppText>

              <AppText variant="caption" tone="inverse">
                Edit profile details or delete this business
              </AppText>
            </View>

            <AppText variant="heading" tone="inverse">
              ›
            </AppText>
          </Pressable>
        ) : null}

        {detail.loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={theme.colors.primary} size="large" />

            <AppText tone="secondary">Loading business details…</AppText>
          </View>
        ) : null}

        {detail.error ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void detail.retry();
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
                {detail.error}
              </AppText>

              <AppText variant="label" tone="brand">
                Tap to retry
              </AppText>
            </Card>
          </Pressable>
        ) : null}

        <ScrollView
          contentContainerStyle={styles.tabs}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {SECTIONS.map((item) => {
            const selected = section === item.id;

            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityState={{
                  selected,
                }}
                onPress={() => {
                  setSection(item.id);
                }}
                style={[
                  styles.tab,
                  {
                    backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
                    borderColor: selected ? theme.colors.primary : theme.colors.border,
                    borderRadius: theme.radius.pill,
                  },
                ]}
              >
                <AppText variant="label" tone={selected ? 'inverse' : 'secondary'}>
                  {item.label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>

        {section === 'about' ? (
          <Card style={styles.section}>
            <AppText variant="subheading">About</AppText>

            <AppText tone="secondary">{business.description}</AppText>

            <View style={styles.row}>
              <AppText tone="secondary">Category</AppText>

              <AppText variant="bodyStrong">{business.category}</AppText>
            </View>

            <View style={styles.row}>
              <AppText tone="secondary">Verification</AppText>

              <AppText variant="bodyStrong">
                {detail.dashboard?.verification?.status ??
                  (business.verified ? 'APPROVED' : 'NOT SUBMITTED')}
              </AppText>
            </View>
          </Card>
        ) : null}

        {section === 'offers' ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AppText variant="subheading">Offers</AppText>

              <AppText variant="caption" tone="secondary">
                {detail.dashboard?.offers.length ?? 0}
              </AppText>
            </View>

            {detail.dashboard?.offers.length ? (
              <View style={styles.cards}>
                {detail.dashboard.offers.map((offer) => (
                  <MarketplaceOfferCard key={offer.id} offer={offer} />
                ))}
              </View>
            ) : (
              <Card variant="muted" style={styles.empty}>
                <AppText variant="subheading">No active offers</AppText>

                <AppText tone="secondary">New promotions will appear here.</AppText>
              </Card>
            )}
          </View>
        ) : null}

        {section === 'events' ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AppText variant="subheading">Business Events</AppText>

              <AppText variant="caption" tone="secondary">
                {detail.dashboard?.events.length ?? 0}
              </AppText>
            </View>

            {detail.dashboard?.events.length ? (
              <View style={styles.cards}>
                {detail.dashboard.events.map((event) => (
                  <MarketplaceEventCard key={event.id} event={event} />
                ))}
              </View>
            ) : (
              <Card variant="muted" style={styles.empty}>
                <AppText variant="subheading">No upcoming events</AppText>

                <AppText tone="secondary">Business events will appear here.</AppText>
              </Card>
            )}
          </View>
        ) : null}

        {section === 'insights' ? (
          <Card style={styles.section}>
            <AppText variant="subheading">Reach and engagement</AppText>

            {[
              ['Profile views', detail.analytics?.profileViews ?? 0],
              ['Offer views', detail.analytics?.offerViews ?? 0],
              ['Event views', detail.analytics?.eventViews ?? 0],
              ['Total reach', detail.analytics?.totalReach ?? 0],
            ].map(([label, value]) => (
              <View key={String(label)} style={styles.row}>
                <AppText tone="secondary">{label}</AppText>

                <AppText variant="bodyStrong">{value}</AppText>
              </View>
            ))}
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  back: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  topCopy: {
    flex: 1,
    gap: 1,
  },
  content: {
    gap: 20,
    paddingBottom: 50,
    paddingHorizontal: 18,
  },
  hero: {
    gap: 12,
  },
  heroIcon: {
    alignItems: 'center',
    height: 68,
    justifyContent: 'center',
    width: 68,
  },
  heroSymbol: {
    fontSize: 31,
    lineHeight: 36,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  manageButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  manageCopy: {
    flex: 1,
    gap: 3,
  },
  loading: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 35,
  },
  errorCard: {
    gap: 8,
  },
  tabs: {
    gap: 8,
  },
  tab: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  section: {
    gap: 13,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cards: {
    gap: 11,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  empty: {
    gap: 8,
  },
});
