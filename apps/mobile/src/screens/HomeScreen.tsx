import { getDashboardData, type DashboardData, type DashboardPost } from '@neighbour/api-client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { useAuth } from '../auth/auth-context';
import { AppText, Card, Screen } from '../components';
import { useNeighbourTheme } from '../theme';

interface DashboardActionProps {
  symbol: string;
  title: string;
  value: string;
  description: string;
  tone: 'community' | 'business' | 'event' | 'information';
}

function DashboardAction({ symbol, title, value, description, tone }: DashboardActionProps) {
  const { theme } = useNeighbourTheme();

  const accentColor = {
    community: theme.colors.community,
    business: theme.colors.business,
    event: theme.colors.event,
    information: theme.colors.information,
  }[tone];

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.actionCard,
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
          styles.actionIcon,
          {
            backgroundColor: `${accentColor}18`,
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        <AppText
          style={{
            color: accentColor,
            fontSize: 24,
            lineHeight: 28,
          }}
        >
          {symbol}
        </AppText>
      </View>

      <View style={styles.actionCopy}>
        <AppText variant="heading">{value}</AppText>
        <AppText variant="bodyStrong">{title}</AppText>
        <AppText variant="caption" tone="secondary">
          {description}
        </AppText>
      </View>
    </Pressable>
  );
}

function FeedPostCard({ post }: { post: DashboardPost }) {
  const { theme } = useNeighbourTheme();

  return (
    <Card style={styles.feedCard}>
      <View style={styles.feedHeader}>
        <View
          style={[
            styles.feedAvatar,
            {
              backgroundColor: theme.colors.primarySoft,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <AppText variant="label" tone="brand">
            {post.author.displayName.slice(0, 1).toUpperCase()}
          </AppText>
        </View>

        <View style={styles.feedIdentity}>
          <AppText variant="bodyStrong">{post.author.displayName}</AppText>

          <AppText variant="caption" tone="muted">
            {post.community?.name ??
              post.neighbourhood?.name ??
              post.author.localArea ??
              'Neighbour'}
          </AppText>
        </View>
      </View>

      {post.title ? <AppText variant="subheading">{post.title}</AppText> : null}

      <AppText tone="secondary">{post.content}</AppText>
    </Card>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { theme } = useNeighbourTheme();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstName = user?.displayName.trim().split(/\s+/)[0] ?? 'Neighbour';

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
      setError('Your dashboard could not be loaded. Pull down to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const localArea = dashboard?.profile?.localArea?.trim() || 'Set your local area';

  const communityCount = dashboard?.communities.length ?? 0;
  const conversationCount = dashboard?.conversations.length ?? 0;
  const unreadMessages = dashboard?.unreadMessages ?? 0;
  const unreadNotifications = dashboard?.unreadNotifications ?? 0;
  const posts = dashboard?.posts ?? [];

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

  if (loading) {
    return (
      <Screen scroll={false} contentStyle={styles.loadingScreen}>
        <ActivityIndicator color={theme.colors.primary} size="large" />

        <AppText variant="subheading">Opening your dashboard…</AppText>

        <AppText variant="caption" tone="secondary">
          Loading your communities, messages and local activity.
        </AppText>
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.screen} scroll>
      <RefreshControl
        refreshing={refreshing}
        onRefresh={() => {
          void loadDashboard(true);
        }}
        tintColor={theme.colors.primary}
      />

      <View style={styles.topBar}>
        <View style={styles.brand}>
          <View
            style={[
              styles.brandMark,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.radius.md,
              },
            ]}
          >
            <AppText variant="bodyStrong" tone="inverse">
              N
            </AppText>
          </View>

          <View>
            <AppText variant="overline" tone="brand">
              Neighbour™
            </AppText>

            <AppText variant="caption" tone="muted">
              Your local world
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

      <View style={styles.hero}>
        <AppText variant="title">
          {greeting}, {firstName}.
        </AppText>

        <AppText variant="bodyLarge" tone="secondary">
          Here is what is happening across your neighbourhood.
        </AppText>
      </View>

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
          <AppText variant="bodyStrong" style={{ color: theme.colors.danger }}>
            Dashboard unavailable
          </AppText>

          <AppText variant="caption" tone="secondary">
            {error}
          </AppText>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void loadDashboard();
            }}
          >
            <AppText variant="label" tone="brand">
              Try again
            </AppText>
          </Pressable>
        </Card>
      ) : null}

      <Card
        style={[
          styles.locationCard,
          {
            backgroundColor: theme.colors.primaryStrong,
          },
        ]}
      >
        <View style={styles.locationHeader}>
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

          <View style={styles.locationCopy}>
            <AppText variant="overline" tone="inverse">
              Your neighbourhood
            </AppText>

            <AppText variant="heading" tone="inverse">
              {localArea}
            </AppText>
          </View>
        </View>

        <AppText variant="body" tone="inverse" style={styles.locationDescription}>
          {dashboard?.profile
            ? 'Your local profile is connected to your Neighbour account.'
            : 'Complete your profile to unlock nearby communities, events and trusted updates.'}
        </AppText>
      </Card>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <AppText variant="subheading">Your community</AppText>

            <AppText variant="caption" tone="secondary">
              Live information from your account.
            </AppText>
          </View>
        </View>

        <View style={styles.actionGrid}>
          <DashboardAction
            symbol="◎"
            title="Communities"
            value={String(communityCount)}
            description="Connected groups"
            tone="community"
          />

          <DashboardAction
            symbol="◌"
            title="Messages"
            value={String(unreadMessages)}
            description={
              unreadMessages > 0 ? 'Unread messages' : `${conversationCount} conversations`
            }
            tone="information"
          />

          <DashboardAction
            symbol="◇"
            title="Notifications"
            value={String(unreadNotifications)}
            description="Unread alerts"
            tone="event"
          />

          <DashboardAction
            symbol="⌂"
            title="Profile"
            value={dashboard?.profile ? 'Ready' : 'Setup'}
            description={dashboard?.profile ? dashboard.profile.username : 'Complete your identity'}
            tone="business"
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <AppText variant="subheading">Community pulse</AppText>

            <AppText variant="caption" tone="secondary">
              Your latest local activity.
            </AppText>
          </View>
        </View>

        {posts.length > 0 ? (
          <View style={styles.feedList}>
            {posts.map((post) => (
              <FeedPostCard key={post.id} post={post} />
            ))}
          </View>
        ) : (
          <Card variant="muted" style={styles.emptyCard}>
            <View
              style={[
                styles.emptyIcon,
                {
                  backgroundColor: theme.colors.surfaceStrong,
                  borderRadius: theme.radius.pill,
                },
              ]}
            >
              <AppText
                style={{
                  color: theme.colors.primary,
                  fontSize: 24,
                }}
              >
                ✦
              </AppText>
            </View>

            <View style={styles.emptyCopy}>
              <AppText variant="bodyStrong">Your feed is ready</AppText>

              <AppText variant="caption" tone="secondary">
                Community posts and trusted local updates will appear here.
              </AppText>
            </View>
          </Card>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 40,
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
    gap: 12,
  },
  brandMark: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  avatar: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  hero: {
    gap: 10,
    marginTop: 34,
  },
  errorCard: {
    gap: 10,
    marginTop: 24,
  },
  locationCard: {
    gap: 18,
    marginTop: 28,
  },
  locationHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  locationIcon: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  locationSymbol: {
    fontSize: 26,
    lineHeight: 30,
  },
  locationCopy: {
    flex: 1,
    gap: 3,
  },
  locationDescription: {
    opacity: 0.82,
  },
  section: {
    gap: 18,
    marginTop: 34,
  },
  sectionHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    borderWidth: StyleSheet.hairlineWidth,
    gap: 14,
    minHeight: 170,
    padding: 18,
    width: '48%',
  },
  actionIcon: {
    alignItems: 'center',
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  actionCopy: {
    gap: 4,
  },
  feedList: {
    gap: 14,
  },
  feedCard: {
    gap: 14,
  },
  feedHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  feedAvatar: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  feedIdentity: {
    flex: 1,
    gap: 2,
  },
  emptyCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  emptyIcon: {
    alignItems: 'center',
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  emptyCopy: {
    flex: 1,
    gap: 5,
  },
});
