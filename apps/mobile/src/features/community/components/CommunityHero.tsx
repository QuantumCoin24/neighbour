import type { Community, CommunityMembership } from '@neighbour/api-client';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card } from '../../../components';
import { useNeighbourTheme } from '../../../theme';

interface CommunityHeroProps {
  community: Community;
  membership: CommunityMembership | null;
  joining: boolean;
  postCount: number;
  eventCount: number;
  businessCount: number;
  onJoin: () => void;
}

export function CommunityHero({
  community,
  membership,
  joining,
  postCount,
  eventCount,
  businessCount,
  onJoin,
}: CommunityHeroProps) {
  const { theme } = useNeighbourTheme();

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
          styles.mark,
          {
            backgroundColor: 'rgba(255,255,255,0.14)',
            borderRadius: theme.radius.xxl,
          },
        ]}
      >
        <AppText tone="inverse" style={styles.markSymbol}>
          ◎
        </AppText>
      </View>

      <View style={styles.copy}>
        <AppText variant="overline" tone="inverse">
          Neighbour community
        </AppText>

        <AppText variant="heading" tone="inverse">
          {community.name}
        </AppText>

        <AppText tone="inverse">
          {community.description ?? 'A trusted place for local people to connect.'}
        </AppText>

        <View style={styles.actions}>
          {membership ? (
            <View
              style={[
                styles.membership,
                {
                  backgroundColor: 'rgba(255,255,255,0.14)',
                  borderRadius: theme.radius.pill,
                },
              ]}
            >
              <AppText variant="label" tone="inverse">
                Joined · {membership.role}
              </AppText>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              disabled={joining}
              onPress={onJoin}
              style={[
                styles.join,
                {
                  backgroundColor: theme.colors.backgroundElevated,
                  borderRadius: theme.radius.pill,
                  opacity: joining ? 0.65 : 1,
                },
              ]}
            >
              {joining ? (
                <ActivityIndicator color={theme.colors.primary} size="small" />
              ) : (
                <AppText variant="label" tone="brand">
                  Join Community
                </AppText>
              )}
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.stats}>
        {[
          ['Members', community.memberCount],
          ['Posts', postCount],
          ['Events', eventCount],
          ['Businesses', businessCount],
        ].map(([label, value]) => (
          <View key={String(label)} style={styles.stat}>
            <AppText variant="subheading" tone="inverse">
              {value}
            </AppText>

            <AppText variant="caption" tone="inverse">
              {label}
            </AppText>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 18,
  },
  mark: {
    alignItems: 'center',
    height: 70,
    justifyContent: 'center',
    width: 70,
  },
  markSymbol: {
    fontSize: 35,
    lineHeight: 40,
  },
  copy: {
    gap: 8,
  },
  actions: {
    alignItems: 'flex-start',
    marginTop: 6,
  },
  membership: {
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  join: {
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 17,
    paddingVertical: 10,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  stat: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 16,
    flexBasis: '46%',
    flexGrow: 1,
    gap: 2,
    padding: 12,
  },
});
