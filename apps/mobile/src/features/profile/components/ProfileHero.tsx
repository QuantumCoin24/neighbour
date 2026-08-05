import type { AuthUser, PrivateProfile } from '@neighbour/api-client';
import { StyleSheet, View } from 'react-native';

import { AppText, Card } from '../../../components';
import { useNeighbourTheme } from '../../../theme';

interface ProfileHeroProps {
  user: AuthUser | null;
  profile: PrivateProfile | null;
  trustScore: number;
  badges: string[];
}

function getInitials(displayName: string | undefined): string {
  return (
    displayName
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.slice(0, 1).toUpperCase())
      .join('') || 'N'
  );
}

export function ProfileHero({ user, profile, trustScore, badges }: ProfileHeroProps) {
  const { theme } = useNeighbourTheme();

  const displayName = profile?.displayName ?? user?.displayName ?? 'Neighbour member';

  return (
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
          styles.avatar,
          {
            backgroundColor: 'rgba(255,255,255,0.16)',
            borderRadius: theme.radius.pill,
          },
        ]}
      >
        <AppText variant="heading" tone="inverse">
          {getInitials(displayName)}
        </AppText>
      </View>

      <View style={styles.identity}>
        <AppText variant="heading" tone="inverse">
          {displayName}
        </AppText>

        {profile?.username ? <AppText tone="inverse">@{profile.username}</AppText> : null}

        {profile?.localArea ? (
          <AppText variant="caption" tone="inverse">
            {profile.localArea}
          </AppText>
        ) : null}
      </View>

      <View style={styles.trust}>
        <View>
          <AppText variant="heading" tone="inverse">
            {trustScore}
          </AppText>

          <AppText variant="caption" tone="inverse">
            Trust score
          </AppText>
        </View>

        <View style={styles.badges}>
          {badges.map((badge) => (
            <View
              key={badge}
              style={[
                styles.badge,
                {
                  backgroundColor: 'rgba(255,255,255,0.14)',
                  borderRadius: theme.radius.pill,
                },
              ]}
            >
              <AppText variant="caption" tone="inverse">
                {badge}
              </AppText>
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    alignItems: 'center',
    height: 88,
    justifyContent: 'center',
    width: 88,
  },
  identity: {
    alignItems: 'center',
    gap: 5,
  },
  trust: {
    alignItems: 'center',
    gap: 12,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});
