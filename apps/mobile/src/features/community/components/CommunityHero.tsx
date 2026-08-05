import type { Community, CommunityMembership } from '@neighbour/api-client';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card } from '../../../components';
import { useNeighbourTheme } from '../../../theme';

interface CommunityHeroProps {
  community: Community;
  membership: CommunityMembership | null;
  joining: boolean;
  leaving: boolean;
  postCount: number;
  eventCount: number;
  businessCount: number;
  onJoin: () => void;
  onLeave: () => void;
}

function roleLabel(membership: CommunityMembership): string {
  return membership.role.charAt(0) + membership.role.slice(1).toLowerCase();
}

export function CommunityHero({
  community,
  membership,
  joining,
  leaving,
  postCount,
  eventCount,
  businessCount,
  onJoin,
  onLeave,
}: CommunityHeroProps) {
  const { theme } = useNeighbourTheme();

  const location = [community.city, community.postcode].filter(Boolean).join(' · ');

  const activeMembership = membership?.status === 'ACTIVE';

  return (
    <Card
      style={[
        styles.hero,
        {
          backgroundColor: community.accentColour ?? theme.colors.primaryStrong,
        },
      ]}
    >
      <View style={styles.identityRow}>
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
            {community.name.charAt(0).toUpperCase()}
          </AppText>
        </View>

        <View style={styles.identity}>
          <AppText variant="overline" tone="inverse">
            CommunityOS
          </AppText>

          <AppText variant="heading" tone="inverse">
            {community.name}
          </AppText>

          <AppText variant="caption" tone="inverse">
            @{community.handle}
          </AppText>
        </View>
      </View>

      <AppText tone="inverse">
        {community.shortDescription ??
          community.description ??
          'A trusted place for neighbours to connect.'}
      </AppText>

      <View style={styles.badges}>
        {location ? (
          <View style={styles.badge}>
            <AppText variant="caption" tone="inverse">
              ⌖ {location}
            </AppText>
          </View>
        ) : null}

        <View style={styles.badge}>
          <AppText variant="caption" tone="inverse">
            {community.visibility === 'PUBLIC'
              ? 'Public community'
              : community.visibility === 'PRIVATE'
                ? 'Private community'
                : 'Invite-only community'}
          </AppText>
        </View>

        <View style={styles.badge}>
          <AppText variant="caption" tone="inverse">
            {community.joinPolicy === 'OPEN'
              ? 'Open joining'
              : community.joinPolicy === 'APPROVAL'
                ? 'Approval required'
                : 'Invitation required'}
          </AppText>
        </View>
      </View>

      <View style={styles.actions}>
        {membership ? (
          <>
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
                {membership.status === 'INVITED'
                  ? 'Join request pending'
                  : `Connected · ${roleLabel(membership)}`}
              </AppText>
            </View>

            {activeMembership && membership.role !== 'OWNER' ? (
              <Pressable
                accessibilityRole="button"
                disabled={leaving}
                onPress={onLeave}
                style={[
                  styles.leave,
                  {
                    borderColor: 'rgba(255,255,255,0.35)',
                    borderRadius: theme.radius.pill,
                    opacity: leaving ? 0.65 : 1,
                  },
                ]}
              >
                {leaving ? (
                  <ActivityIndicator color={theme.colors.inverseText} size="small" />
                ) : (
                  <AppText variant="label" tone="inverse">
                    Leave
                  </AppText>
                )}
              </Pressable>
            ) : null}
          </>
        ) : community.joinPolicy === 'INVITE_ONLY' ? (
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
              Invitation required
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
                {community.joinPolicy === 'APPROVAL' ? 'Request to Join' : 'Join Community'}
              </AppText>
            )}
          </Pressable>
        )}
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
  identityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 15,
  },
  mark: {
    alignItems: 'center',
    height: 70,
    justifyContent: 'center',
    width: 70,
  },
  markSymbol: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
  },
  identity: {
    flex: 1,
    gap: 3,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.11)',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  membership: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  join: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  leave: {
    alignItems: 'center',
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 16,
    paddingVertical: 9,
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
