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

function formatMemberCount(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    notation: value >= 1_000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value);
}

export function CommunityCard({
  community,
  membership,
  joining = false,
  onOpen,
  onJoin,
}: CommunityCardProps) {
  const { theme } = useNeighbourTheme();

  const joined = membership?.status === 'ACTIVE' || membership?.status === 'INVITED';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onOpen}
      style={({ pressed }) => ({
        opacity: pressed ? 0.78 : 1,
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
                fontSize: 27,
                lineHeight: 31,
              }}
            >
              ◎
            </AppText>
          </View>

          <View style={styles.identity}>
            <AppText variant="subheading" numberOfLines={1}>
              {community.name}
            </AppText>

            <AppText variant="caption" tone="secondary">
              @{community.slug}
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
              {community.visibility === 'PUBLIC' ? 'Public' : 'Private'}
            </AppText>
          </View>
        </View>

        {community.description ? (
          <AppText tone="secondary" numberOfLines={3}>
            {community.description}
          </AppText>
        ) : (
          <AppText tone="muted">A Neighbour community for local connection.</AppText>
        )}

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
                  {membership.role}
                </AppText>
              </View>
            ) : null}
          </View>

          {joined ? (
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
                Joined ✓
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
                  Join
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
    gap: 15,
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
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metrics: {
    alignItems: 'center',
    flexDirection: 'row',
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
  joinButton: {
    alignItems: 'center',
    minHeight: 40,
    minWidth: 76,
    justifyContent: 'center',
    paddingHorizontal: 17,
    paddingVertical: 9,
  },
});
