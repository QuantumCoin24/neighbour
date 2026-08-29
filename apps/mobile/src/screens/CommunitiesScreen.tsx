import { useFocusEffect } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppText, Card, Screen } from '../components';
import CompactStatusCard from '../components/system/CompactStatusCard';
import ScreenHero from '../components/system/ScreenHero';
import { CommunityCard, useCommunityDirectory } from '../features/community';
import type { AppTabParamList } from '../navigation/routes';
import { useNeighbourTheme } from '../theme';

type CommunitiesScreenProps = BottomTabScreenProps<AppTabParamList, 'Communities'>;

export default function CommunitiesScreen({ navigation }: CommunitiesScreenProps) {
  const { theme } = useNeighbourTheme();
  const directory = useCommunityDirectory();

  useEffect(() => {
    if (__DEV__ && directory.error) {
      console.warn('[Neighbour/Communities] load error:', directory.error);
    }
  }, [directory.error]);

  useFocusEffect(
    useCallback(() => {
      void directory.refresh();
    }, [directory.refresh]),
  );

  return (
    <Screen
      contentStyle={styles.screen}
      refreshControl={
        <RefreshControl
          refreshing={directory.refreshing}
          onRefresh={() => {
            void directory.refresh();
          }}
          tintColor={theme.colors.primary}
        />
      }
    >
      <ScreenHero
        eyebrow="NEIGHBOUR COMMUNITIES™"
        title="Communities"
        description="Find trusted local groups and connect with the people around you."
        symbol="◎"
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            navigation.getParent()?.navigate('CreateCommunity');
          }}
          style={[
            styles.createButton,
            {
              backgroundColor: theme.colors.primary,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <View
            style={[
              styles.createIcon,
              {
                backgroundColor: theme.colors.inverseText,
                borderRadius: theme.radius.pill,
              },
            ]}
          >
            <AppText
              style={{
                color: theme.colors.primary,
                fontSize: 19,
                fontWeight: '800',
              }}
            >
              +
            </AppText>
          </View>

          <View style={styles.createCopy}>
            <AppText variant="bodyStrong" tone="inverse">
              Create a community
            </AppText>

            <AppText
              variant="caption"
              style={{
                color: theme.colors.inverseText,
                opacity: 0.78,
              }}
            >
              Start a trusted local space
            </AppText>
          </View>

          <AppText tone="inverse" style={styles.createArrow}>
            ›
          </AppText>
        </Pressable>
      </ScreenHero>

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
          accessibilityLabel="Search communities"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={directory.setQuery}
          placeholder="Search communities"
          placeholderTextColor={theme.colors.textMuted}
          selectionColor={theme.colors.primary}
          style={[
            styles.input,
            {
              color: theme.colors.text,
            },
          ]}
          value={directory.query}
        />
      </View>

      <View
        style={[
          styles.discoveryMode,
          {
            backgroundColor: theme.colors.surfaceMuted,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.pill,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityState={{
            disabled: !directory.locationAvailable,
            selected: directory.discoveryMode === 'nearby',
          }}
          disabled={!directory.locationAvailable}
          onPress={() => directory.setDiscoveryMode('nearby')}
          style={[
            styles.discoveryModeButton,
            directory.discoveryMode === 'nearby'
              ? {
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.radius.pill,
                }
              : null,
            !directory.locationAvailable ? styles.discoveryModeDisabled : null,
          ]}
        >
          <AppText
            variant="label"
            tone={directory.discoveryMode === 'nearby' ? 'brand' : 'secondary'}
          >
            Near you
          </AppText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{
            selected: directory.discoveryMode === 'everywhere',
          }}
          onPress={() => directory.setDiscoveryMode('everywhere')}
          style={[
            styles.discoveryModeButton,
            directory.discoveryMode === 'everywhere'
              ? {
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.radius.pill,
                }
              : null,
          ]}
        >
          <AppText
            variant="label"
            tone={directory.discoveryMode === 'everywhere' ? 'brand' : 'secondary'}
          >
            Explore everywhere
          </AppText>
        </Pressable>
      </View>

      {!directory.locationAvailable ? (
        <AppText variant="caption" tone="secondary">
          Add a saved postcode or location to your profile to discover communities near you.
        </AppText>
      ) : null}
      {directory.error ? (
        <CompactStatusCard
          title="Communities are reconnecting"
          message="Live community information is temporarily unavailable."
          actionLabel="Retry"
          onPress={() => {
            void directory.retry();
          }}
          tone="warning"
        />
      ) : null}

      {directory.loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.colors.primary} size="large" />

          <AppText tone="secondary">Opening your communities…</AppText>
        </View>
      ) : (
        <>
          {directory.joinedItems.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionCopy}>
                  <AppText variant="subheading">My communities</AppText>

                  <AppText variant="caption" tone="secondary">
                    Groups you are connected to.
                  </AppText>
                </View>

                <AppText variant="caption" tone="brand">
                  {directory.joinedItems.length}
                </AppText>
              </View>

              <View style={styles.cards}>
                {directory.joinedItems.map(({ community, membership }) => (
                  <CommunityCard
                    key={community.id}
                    community={community}
                    membership={membership}
                    onJoin={() => {
                      void directory.join(community);
                    }}
                    onOpen={() => {
                      navigation.getParent()?.navigate('CommunityDetail', {
                        slug: community.slug,
                      });
                    }}
                  />
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionCopy}>
                <AppText variant="subheading">
                  {directory.discoveryMode === 'nearby'
                    ? 'Communities near you'
                    : 'Explore communities'}
                </AppText>
                <AppText variant="caption" tone="secondary">
                  {directory.discoveryMode === 'nearby'
                    ? `Within ${directory.radiusKm} km of your saved location.`
                    : 'Join public communities across Neighbour.'}
                </AppText>
              </View>

              <AppText variant="caption" tone="brand">
                {directory.discoverItems.length}
              </AppText>
            </View>

            {directory.discoverItems.length > 0 ? (
              <View style={styles.cards}>
                {directory.discoverItems.map(({ community, membership }) => (
                  <CommunityCard
                    key={community.id}
                    community={community}
                    membership={membership}
                    joining={directory.joiningSlug === community.slug}
                    onJoin={() => {
                      void directory.join(community);
                    }}
                    onOpen={() => {
                      navigation.getParent()?.navigate('CommunityDetail', {
                        slug: community.slug,
                      });
                    }}
                  />
                ))}
              </View>
            ) : (
              <Card variant="muted" style={styles.emptyCard}>
                <View
                  style={[
                    styles.emptyIcon,
                    {
                      backgroundColor: theme.colors.primarySoft,
                      borderRadius: theme.radius.pill,
                    },
                  ]}
                >
                  <AppText
                    style={{
                      color: theme.colors.community,
                      fontSize: 27,
                    }}
                  >
                    ◎
                  </AppText>
                </View>

                <View style={styles.emptyCopy}>
                  <AppText variant="subheading">
                    {directory.discoveryMode === 'nearby'
                      ? 'No nearby communities found'
                      : 'No matching communities'}
                  </AppText>
                  <AppText tone="secondary">
                    {directory.discoveryMode === 'nearby'
                      ? `There are no discoverable communities within ${directory.radiusKm} km matching this view.`
                      : 'Try a different name or clear your search.'}
                  </AppText>
                </View>
              </Card>
            )}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 24,
    paddingBottom: 48,
  },
  createButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 13,
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  createIcon: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  createCopy: {
    flex: 1,
    gap: 2,
  },
  createArrow: {
    fontSize: 28,
    lineHeight: 30,
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
  discoveryMode: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    padding: 4,
  },
  discoveryModeButton: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  discoveryModeDisabled: {
    opacity: 0.42,
  },
  loading: {
    alignItems: 'center',
    gap: 13,
    paddingVertical: 60,
  },
  section: {
    gap: 14,
  },
  sectionHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionCopy: {
    flex: 1,
    gap: 3,
  },
  cards: {
    gap: 13,
  },
  emptyCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  emptyIcon: {
    alignItems: 'center',
    height: 55,
    justifyContent: 'center',
    width: 55,
  },
  emptyCopy: {
    flex: 1,
    gap: 5,
  },
});
