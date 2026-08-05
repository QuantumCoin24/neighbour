import type { Community, CommunityMembership } from '@neighbour/api-client';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card } from '../../../components';
import { useNeighbourTheme } from '../../../theme';

interface CommunityCardProps {
  community: Community;
  membership: CommunityMembership | null;
  joining?: boolean;
  onOpen: () => void;
  onJoin: () => void;
}

const CATEGORY_LABELS: Record<Community['category'], string> = {
  LOCAL_AREA: 'Local area',
  STREET: 'Street',
  ESTATE: 'Estate',
  VILLAGE: 'Village',
  TOWN: 'Town',
  CITY: 'City',
  SCHOOL: 'School',
  PARENTS: 'Parents',
  SPORTS: 'Sports',
  CHARITY: 'Charity',
  BUSINESS_NETWORK: 'Business network',
  HOBBY: 'Hobby',
  FAITH: 'Faith',
  OTHER: 'Community',
};

const CATEGORY_SYMBOLS: Record<Community['category'], string> = {
  LOCAL_AREA: '⌖',
  STREET: '↔',
  ESTATE: '▦',
  VILLAGE: '⌂',
  TOWN: '◎',
  CITY: '▥',
  SCHOOL: '◇',
  PARENTS: '◉',
  SPORTS: '●',
  CHARITY: '♡',
  BUSINESS_NETWORK: '▣',
  HOBBY: '✦',
  FAITH: '✧',
  OTHER: '○',
};

function formatMemberCount(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    notation: value >= 1_000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value);
}

function formatRole(membership: CommunityMembership): string {
  if (membership.role === 'OWNER') {
    return 'Owner';
  }

  if (membership.role === 'ADMIN') {
    return 'Admin';
  }

  if (membership.role === 'MODERATOR') {
    return 'Moderator';
  }

  return membership.status === 'INVITED' ? 'Pending' : 'Member';
}

export function CommunityCard({
  community,
  membership,
  joining = false,
  onOpen,
  onJoin,
}: CommunityCardProps) {
  const { theme } = useNeighbourTheme();

  const connected = membership?.status === 'ACTIVE' || membership?.status === 'INVITED';

  const location = [community.city, community.postcode].filter(Boolean).join(' · ');

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onOpen}
      style={({ pressed }) => ({
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Card style={styles.card}>
        <View style={styles.header}>
          <View
            style={[
              styles.icon,
              {
                backgroundColor: theme.colors.primarySoft,
                borderRadius: theme.radius.xl,
              },
            ]}
          >
            <AppText
              style={{
                color: theme.colors.community,
                fontSize: 26,
                lineHeight: 30,
              }}
            >
              {CATEGORY_SYMBOLS[community.category]}
            </AppText>
          </View>

          <View style={styles.identity}>
            <AppText variant="subheading" numberOfLines={1}>
              {community.name}
            </AppText>

            <AppText variant="caption" tone="brand" numberOfLines={1}>
              @{community.handle}
            </AppText>
          </View>

          <View
            style={[
              styles.visibility,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderRadius: theme.radius.pill,
              },
            ]}
          >
            <AppText variant="caption" tone="secondary">
              {community.visibility === 'PUBLIC'
                ? 'Public'
                : community.visibility === 'INVITE_ONLY'
                  ? 'Invite'
                  : 'Private'}
            </AppText>
          </View>
        </View>

        <View style={styles.meta}>
          <View
            style={[
              styles.metaPill,
              {
                backgroundColor: theme.colors.primarySoft,
                borderRadius: theme.radius.pill,
              },
            ]}
          >
            <AppText variant="caption" tone="brand">
              {CATEGORY_LABELS[community.category]}
            </AppText>
          </View>

          {location ? (
            <View
              style={[
                styles.metaPill,
                {
                  backgroundColor: theme.colors.surfaceMuted,
                  borderRadius: theme.radius.pill,
                },
              ]}
            >
              <AppText variant="caption" tone="secondary">
                ⌖ {location}
              </AppText>
            </View>
          ) : null}

          <View
            style={[
              styles.metaPill,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderRadius: theme.radius.pill,
              },
            ]}
          >
            <AppText variant="caption" tone="secondary">
              {community.joinPolicy === 'OPEN'
                ? 'Open joining'
                : community.joinPolicy === 'APPROVAL'
                  ? 'Approval required'
                  : 'Invite only'}
            </AppText>
          </View>
        </View>

        <AppText tone="secondary" numberOfLines={3}>
          {community.shortDescription ??
            community.description ??
            'A Neighbour community for trusted local connection.'}
        </AppText>

        {community.tags.length > 0 ? (
          <View style={styles.tags}>
            {community.tags.slice(0, 3).map((tag) => (
              <AppText key={tag} variant="caption" tone="muted">
                #{tag}
              </AppText>
            ))}
          </View>
        ) : null}

        <View style={styles.footer}>
          <View style={styles.metrics}>
            <AppText variant="bodyStrong">{formatMemberCount(community.memberCount)}</AppText>

            <AppText variant="caption" tone="secondary">
              members
            </AppText>

            {membership ? (
              <View
                style={[
                  styles.role,
                  {
                    backgroundColor: theme.colors.primarySoft,
                    borderRadius: theme.radius.pill,
                  },
                ]}
              >
                <AppText variant="caption" tone="brand">
                  {formatRole(membership)}
                </AppText>
              </View>
            ) : null}
          </View>

          {connected ? (
            <View
              style={[
                styles.joined,
                {
                  backgroundColor: theme.colors.primarySoft,
                  borderRadius: theme.radius.pill,
                },
              ]}
            >
              <AppText variant="label" tone="brand">
                {membership?.status === 'INVITED' ? 'Pending' : 'Connected ✓'}
              </AppText>
            </View>
          ) : community.joinPolicy === 'INVITE_ONLY' ? (
            <View
              style={[
                styles.inviteOnly,
                {
                  backgroundColor: theme.colors.surfaceMuted,
                  borderRadius: theme.radius.pill,
                },
              ]}
            >
              <AppText variant="label" tone="secondary">
                Invite only
              </AppText>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{
                busy: joining,
                disabled: joining,
              }}
              disabled={joining}
              onPress={(event) => {
                event.stopPropagation();
                onJoin();
              }}
              style={({ pressed }) => [
                styles.joinButton,
                {
                  backgroundColor: theme.colors.primary,
                  borderRadius: theme.radius.pill,
                  opacity: joining || pressed ? 0.68 : 1,
                },
              ]}
            >
              {joining ? (
                <ActivityIndicator color={theme.colors.inverseText} size="small" />
              ) : (
                <AppText variant="label" tone="inverse">
                  {community.joinPolicy === 'APPROVAL' ? 'Request' : 'Join'}
                </AppText>
              )}
            </Pressable>
          )}
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  icon: {
    alignItems: 'center',
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  identity: {
    flex: 1,
    gap: 2,
  },
  visibility: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  metaPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  metrics: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  role: {
    marginLeft: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  joined: {
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  inviteOnly: {
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  joinButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    minWidth: 82,
    paddingHorizontal: 17,
    paddingVertical: 9,
  },
});
