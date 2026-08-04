import { Pressable, StyleSheet, View } from 'react-native';

import { useAuth } from '../auth/auth-context';
import { AppText, Card, Screen } from '../components';
import { useNeighbourTheme } from '../theme';

interface DashboardActionProps {
  symbol: string;
  title: string;
  description: string;
  tone: 'community' | 'business' | 'event' | 'information';
}

function DashboardAction({ symbol, title, description, tone }: DashboardActionProps) {
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
        <AppText variant="bodyStrong">{title}</AppText>

        <AppText variant="caption" tone="secondary">
          {description}
        </AppText>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { theme } = useNeighbourTheme();

  const firstName = user?.displayName.trim().split(/\s+/)[0] ?? 'Neighbour';

  return (
    <Screen contentStyle={styles.screen}>
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
        <AppText variant="title">Good evening, {firstName}.</AppText>

        <AppText variant="bodyLarge" tone="secondary">
          Here is what is happening across your neighbourhood.
        </AppText>
      </View>

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
              Set your local area
            </AppText>
          </View>
        </View>

        <AppText variant="body" tone="inverse" style={styles.locationDescription}>
          Complete your profile to unlock nearby communities, events, businesses and trusted local
          updates.
        </AppText>
      </Card>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <AppText variant="subheading">Your community</AppText>

            <AppText variant="caption" tone="secondary">
              Everything local, in one place.
            </AppText>
          </View>

          <AppText variant="label" tone="brand">
            Explore
          </AppText>
        </View>

        <View style={styles.actionGrid}>
          <DashboardAction
            symbol="◎"
            title="Communities"
            description="Connect locally"
            tone="community"
          />

          <DashboardAction
            symbol="◌"
            title="Messages"
            description="Speak privately"
            tone="information"
          />

          <DashboardAction symbol="◇" title="Events" description="See what is on" tone="event" />

          <DashboardAction
            symbol="⌂"
            title="Businesses"
            description="Support local"
            tone="business"
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <AppText variant="subheading">Community pulse</AppText>

            <AppText variant="caption" tone="secondary">
              Your latest neighbourhood activity.
            </AppText>
          </View>
        </View>

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
            <AppText variant="bodyStrong">Your local feed is ready</AppText>

            <AppText variant="caption" tone="secondary">
              Community posts, alerts and recommendations will appear here as you connect with your
              area.
            </AppText>
          </View>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 40,
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
    minHeight: 150,
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
