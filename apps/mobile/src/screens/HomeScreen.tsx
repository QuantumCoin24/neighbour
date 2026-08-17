import { getDashboardData, type DashboardData } from '@neighbour/api-client';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { useAuth } from '../auth/auth-context';
import { AppText, Card, Screen } from '../components';
import NeighbourMark from '../components/brand/NeighbourMark';
import { FeedList, useFeedController } from '../features/feed';
import type { AppTabParamList } from '../navigation/routes';
import { useNeighbourTheme } from '../theme';

interface StatCardProps {
  symbol: string;
  value: string;
  label: string;
  description: string;
  accent: string;
  onPress: () => void;
}

function StatCard({
  symbol,
  value,
  label,
  description,
  accent,
  onPress,
}: StatCardProps) {
  const { theme } = useNeighbourTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.statCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.xl,
          opacity: pressed ? 0.82 : 1,
        },
        theme.shadows.subtle,
      ]}
    >
      <View
        style={[
          styles.statIcon,
          {
            backgroundColor: `${accent}14`,
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        <AppText
          style={{
            color: accent,
            fontSize: 24,
            lineHeight: 28,
            fontWeight: '700',
          }}
        >
          {symbol}
        </AppText>
      </View>

      <AppText style={styles.statValue}>{value}</AppText>

      <AppText variant="bodyStrong">{label}</AppText>

      <AppText variant="caption" tone="secondary">
        {description}
      </AppText>
    </Pressable>
  );
}

type HomeScreenProps = BottomTabScreenProps<AppTabParamList, 'Home'>;

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { user } = useAuth();
  const { theme } = useNeighbourTheme();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const feed = useFeedController();

  const firstName = user?.displayName?.trim().split(/\s+/)[0] || 'Neighbour';

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const data = await getDashboardData();
      setDashboard(data);
    } catch {
      setError('Dashboard connection unavailable.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12) {
      return 'Good morning';
    }

    if (hour < 18) {
      return 'Good afternoon';
    }

    return 'Good evening';
  }, []);

  const localArea = dashboard?.profile?.localArea?.trim() || 'Set your local area';

  const communityCount = dashboard?.communities.length ?? 0;
  const conversationCount = dashboard?.conversations.length ?? 0;
  const unreadMessages = dashboard?.unreadMessages ?? 0;
  const unreadNotifications = dashboard?.unreadNotifications ?? 0;

  if (loading) {
    return (
      <Screen scroll={false} contentStyle={styles.loadingScreen}>
        <NeighbourMark size={82} />

        <ActivityIndicator color={theme.colors.primary} size="small" />

        <AppText variant="subheading">Opening Neighbour™</AppText>

        <AppText variant="caption" tone="secondary">
          Connecting you to your local world.
        </AppText>
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      contentStyle={styles.screen}
      refreshControl={
        <RefreshControl
          refreshing={refreshing || feed.refreshing}
          onRefresh={() => {
            void Promise.all([loadDashboard(true), feed.refresh()]);
          }}
          tintColor={theme.colors.primary}
        />
      }
    >
      {/* BRAND HEADER */}

      <View style={styles.topBar}>
        <View style={styles.brand}>
          <NeighbourMark size={58} />

          <View style={styles.brandCopy}>
            <AppText variant="overline" tone="brand">
              NEIGHBOUR™
            </AppText>

            <AppText variant="caption" tone="muted">
              Stronger together. Local forever.
            </AppText>
          </View>
        </View>

        <View
          style={[
            styles.avatar,
            {
              backgroundColor: theme.colors.primarySoft,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <AppText variant="label" tone="brand">
            {firstName.slice(0, 1).toUpperCase()}
          </AppText>
        </View>
      </View>

      {/* GREETING */}

      <View style={styles.welcome}>
        <AppText variant="overline" tone="brand" style={styles.welcomeEyebrow}>
          YOUR NEIGHBOURHOOD
        </AppText>

        <AppText style={styles.welcomeTitle}>
          {greeting}, {firstName}.
        </AppText>

        <AppText variant="bodyLarge" tone="secondary" style={styles.welcomeDescription}>
          Discover what is happening nearby, connect with trusted neighbours and take part in the
          place you call home.
        </AppText>
      </View>

      {/* COMPACT CONNECTION NOTICE */}

      {error ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void loadDashboard();
          }}
          style={({ pressed }) => [
            styles.connectionNotice,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.lg,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <View
            style={[
              styles.connectionDot,
              {
                backgroundColor: theme.colors.warning,
              },
            ]}
          />

          <View style={styles.connectionCopy}>
            <AppText variant="bodyStrong">Local information is reconnecting</AppText>

            <AppText variant="caption" tone="secondary">
              Your Neighbour experience remains available. Tap to retry.
            </AppText>
          </View>

          <AppText variant="bodyStrong" tone="brand">
            ↻
          </AppText>
        </Pressable>
      ) : null}

      {/* NEIGHBOURHOOD HERO */}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Explore your local area"
        onPress={() => {
          navigation.navigate('Maps');
        }}
      >
        <Card
          style={[
            styles.neighbourhoodCard,
          {
            backgroundColor: theme.colors.primaryStrong,
          },
        ]}
      >
        <View style={styles.neighbourhoodTop}>
          <View
            style={[
              styles.locationIcon,
              {
                backgroundColor: 'rgba(255,255,255,0.14)',
                borderRadius: theme.radius.lg,
              },
            ]}
          >
            <AppText tone="inverse" style={styles.locationSymbol}>
              ⌖
            </AppText>
          </View>

          <View style={styles.neighbourhoodCopy}>
            <AppText variant="overline" tone="inverse">
              YOUR NEIGHBOURHOOD
            </AppText>

            <AppText variant="heading" tone="inverse" style={styles.neighbourhoodTitle}>
              {localArea}
            </AppText>
          </View>
        </View>

        <AppText variant="body" tone="inverse" style={styles.neighbourhoodDescription}>
          {dashboard?.profile
            ? 'Explore communities, events and local activity around you.'
            : 'Complete your profile to discover communities, events and local updates around you.'}
        </AppText>

        <View style={styles.exploreRow}>
          <AppText variant="bodyStrong" tone="inverse">
            Explore your area
          </AppText>

          <AppText variant="bodyStrong" tone="inverse">
            →
          </AppText>
        </View>
        </Card>
      </Pressable>

      {/* COMMUNITY STATS */}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeadingCopy}>
            <AppText variant="subheading">Your community</AppText>

            <AppText variant="caption" tone="secondary">
              Your local connections at a glance.
            </AppText>
          </View>

          <AppText variant="label" tone="brand">
            See all
          </AppText>
        </View>

        <View style={styles.statGrid}>
          <StatCard
            symbol="◎"
            value={String(communityCount)}
            label="Communities"
            description="Connected groups"
            accent={theme.colors.community}
            onPress={() => {
              navigation.navigate('Communities');
            }}
          />

          <StatCard
            symbol="◌"
            value={String(unreadMessages)}
            label="Messages"
            description={
              unreadMessages > 0 ? 'Unread messages' : `${conversationCount} conversations`
            }
            accent={theme.colors.information}
            onPress={() => {
              navigation.navigate('Messages');
            }}
          />

          <StatCard
            symbol="◇"
            value={String(unreadNotifications)}
            label="Alerts"
            description="Local notifications"
            accent={theme.colors.event}
            onPress={() => {
              navigation.navigate('Communities');
            }}
          />

          <StatCard
            symbol="⌂"
            value={dashboard?.profile ? 'Ready' : 'Setup'}
            label="Profile"
            description={dashboard?.profile ? dashboard.profile.username : 'Complete your identity'}
            accent={theme.colors.business}
            onPress={() => {
              navigation.navigate('Profile');
            }}
          />
        </View>
      </View>

      {/* COMMUNITY PULSE */}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeadingCopy}>
            <AppText variant="subheading">Local activity</AppText>

            <AppText variant="caption" tone="secondary">
              Recent posts and updates from around you.
            </AppText>
          </View>

          <AppText variant="label" tone="brand">
            See all
          </AppText>
        </View>

        {feed.loading ? (
          <View style={styles.feedLoading}>
            <ActivityIndicator color={theme.colors.primary} size="small" />

            <AppText variant="caption" tone="secondary">
              Finding local activity…
            </AppText>
          </View>
        ) : feed.error && feed.posts.length === 0 ? (
          <Card variant="muted" style={styles.feedError}>
            <AppText variant="bodyStrong">Local activity is reconnecting</AppText>

            <AppText variant="caption" tone="secondary">
              Pull down to refresh or try again.
            </AppText>

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void feed.retry();
              }}
            >
              <AppText variant="label" tone="brand">
                Try again
              </AppText>
            </Pressable>
          </Card>
        ) : (
          <FeedList
            posts={feed.posts}
            hasMore={feed.nextCursor !== null}
            loadingMore={feed.loadingMore}
            error={feed.posts.length > 0 ? feed.error : null}
            onLoadMore={() => {
              void feed.loadMore();
            }}
            onRetry={() => {
              void feed.loadMore();
            }}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 48,
  },

  loadingScreen: {
    alignItems: 'center',
    flex: 1,
    gap: 14,
    justifyContent: 'center',
  },

  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  brand: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: 13,
  },

  brandCopy: {
    flex: 1,
    gap: 2,
  },

  avatar: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    marginLeft: 12,
    width: 48,
  },

  welcome: {
    gap: 12,
    marginTop: 38,
  },

  welcomeEyebrow: {
    letterSpacing: 1.7,
  },

  welcomeTitle: {
    fontSize: 39,
    fontWeight: '800',
    letterSpacing: -1.4,
    lineHeight: 44,
  },

  welcomeDescription: {
    lineHeight: 28,
    maxWidth: 590,
  },

  connectionNotice: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  connectionDot: {
    borderRadius: 5,
    height: 8,
    width: 8,
  },

  connectionCopy: {
    flex: 1,
    gap: 2,
  },

  neighbourhoodCard: {
    borderWidth: 0,
    gap: 22,
    marginTop: 28,
    padding: 24,
  },

  neighbourhoodTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
  },

  locationIcon: {
    alignItems: 'center',
    height: 58,
    justifyContent: 'center',
    width: 58,
  },

  locationSymbol: {
    fontSize: 29,
    lineHeight: 34,
  },

  neighbourhoodCopy: {
    flex: 1,
    gap: 3,
  },

  neighbourhoodTitle: {
    fontSize: 27,
    lineHeight: 33,
  },

  neighbourhoodDescription: {
    lineHeight: 25,
    opacity: 0.86,
  },

  exploreRow: {
    alignItems: 'center',
    borderTopColor: 'rgba(255,255,255,0.18)',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 17,
  },

  section: {
    gap: 18,
    marginTop: 36,
  },

  sectionHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },

  sectionHeadingCopy: {
    flex: 1,
    gap: 3,
  },

  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  statCard: {
    borderWidth: StyleSheet.hairlineWidth,
    gap: 7,
    minHeight: 178,
    padding: 18,
    width: '48%',
  },

  statIcon: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    marginBottom: 6,
    width: 48,
  },

  statValue: {
    fontSize: 31,
    fontWeight: '800',
    lineHeight: 36,
  },

  feedLoading: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 30,
  },

  feedError: {
    gap: 10,
  },
});
