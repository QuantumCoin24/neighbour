import { useFocusEffect } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppText, Card, Screen } from '../components';
import { CommunityCard, useCommunityDirectory } from '../features/community';
import type { AppTabParamList } from '../navigation/routes';
import { useNeighbourTheme } from '../theme';

type CommunitiesScreenProps = BottomTabScreenProps<AppTabParamList, 'Communities'>;

export default function CommunitiesScreen({ navigation }: CommunitiesScreenProps) {
  const { theme } = useNeighbourTheme();
  const directory = useCommunityDirectory();

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
      <View style={styles.header}>
        <AppText variant="overline" tone="brand">
          Local connections
        </AppText>

        <AppText variant="title">Communities</AppText>

        <AppText variant="bodyLarge" tone="secondary">
          Discover trusted groups built around the places and interests that matter to you.
        </AppText>

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
            theme.shadows.subtle,
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
                fontSize: 20,
                fontWeight: '800',
              }}
            >
              +
            </AppText>
          </View>

          <View style={styles.createCopy}>
            <AppText variant="bodyStrong" tone="inverse">
              Create a Community
            </AppText>

            <AppText
              variant="caption"
              style={{
                color: theme.colors.inverseText,
                opacity: 0.82,
              }}
            >
              Start a new local space
            </AppText>
          </View>

          <AppText tone="inverse" style={styles.createArrow}>
            ›
          </AppText>
        </Pressable>
      </View>

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

      {directory.error ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void directory.retry();
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
              variant="bodyStrong"
              style={{
                color: theme.colors.danger,
              }}
            >
              Communities unavailable
            </AppText>

            <AppText tone="secondary">{directory.error}</AppText>

            <AppText variant="label" tone="brand">
              Tap to retry
            </AppText>
          </Card>
        </Pressable>
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
                  <AppText variant="subheading">My Communities</AppText>

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
                <AppText variant="subheading">Discover Communities</AppText>

                <AppText variant="caption" tone="secondary">
                  Join public communities across Neighbour.
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
                  <AppText variant="subheading">No matching communities</AppText>

                  <AppText tone="secondary">Try a different name or clear your search.</AppText>
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
  header: {
    gap: 10,
  },
  createButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 13,
    marginTop: 8,
    minHeight: 72,
    paddingHorizontal: 15,
    paddingVertical: 12,
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
  errorCard: {
    gap: 8,
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
