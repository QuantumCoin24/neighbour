import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Card } from '../components';
import {
  CommunityBusinessCard,
  CommunityEventCard,
  CommunityHero,
  useCommunityDetail,
  type CommunityDetailSection,
} from '../features/community';
import { CommunityPostComposer, FeedList } from '../features/feed';
import type { RootStackParamList } from '../navigation/routes';
import { useNeighbourTheme } from '../theme';

type CommunityDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'CommunityDetail'>;

const SECTIONS: {
  id: CommunityDetailSection;
  label: string;
}[] = [
  {
    id: 'overview',
    label: 'Overview',
  },
  {
    id: 'feed',
    label: 'Feed',
  },
  {
    id: 'events',
    label: 'Events',
  },
  {
    id: 'businesses',
    label: 'Businesses',
  },
  {
    id: 'about',
    label: 'About',
  },
];

export default function CommunityDetailScreen({ navigation, route }: CommunityDetailScreenProps) {
  const { theme } = useNeighbourTheme();
  const detail = useCommunityDetail(route.params.slug);

  useFocusEffect(
    useCallback(() => {
      void detail.refresh();
    }, [detail.refresh]),
  );

  const [section, setSection] = useState<CommunityDetailSection>('overview');

  if (detail.loading) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <View style={styles.loading}>
          <ActivityIndicator color={theme.colors.primary} size="large" />

          <AppText tone="secondary">Opening community…</AppText>
        </View>
      </SafeAreaView>
    );
  }

  if (!detail.community) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <View style={styles.failure}>
          <AppText variant="heading">Community unavailable</AppText>

          <AppText tone="secondary">{detail.error ?? 'This community could not be found.'}</AppText>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              navigation.goBack();
            }}
          >
            <AppText variant="label" tone="brand">
              Go back
            </AppText>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Back to communities"
          accessibilityRole="button"
          onPress={() => {
            navigation.goBack();
          }}
          style={[
            styles.back,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <AppText variant="bodyStrong">‹</AppText>
        </Pressable>

        <View style={styles.topCopy}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {detail.community.name}
          </AppText>

          <AppText variant="caption" tone="secondary">
            @{detail.community.handle}
          </AppText>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={detail.refreshing}
            onRefresh={() => {
              void detail.refresh();
            }}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <CommunityHero
          businessCount={detail.businesses.length}
          community={detail.community}
          eventCount={detail.events.length}
          joining={detail.joining}
          leaving={detail.leaving}
          membership={detail.membership}
          onJoin={() => {
            void detail.join();
          }}
          onLeave={() => {
            void detail.leave();
          }}
          postCount={detail.posts.length}
        />

        {detail.error ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void detail.retry();
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
                style={{
                  color: theme.colors.danger,
                }}
              >
                {detail.error}
              </AppText>

              <AppText variant="label" tone="brand">
                Tap to retry
              </AppText>
            </Card>
          </Pressable>
        ) : null}

        <ScrollView
          contentContainerStyle={styles.tabs}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {SECTIONS.map((item) => {
            const selected = section === item.id;

            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityState={{
                  selected,
                }}
                onPress={() => {
                  setSection(item.id);
                }}
                style={[
                  styles.tab,
                  {
                    backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
                    borderColor: selected ? theme.colors.primary : theme.colors.border,
                    borderRadius: theme.radius.pill,
                  },
                ]}
              >
                <AppText variant="label" tone={selected ? 'inverse' : 'secondary'}>
                  {item.label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>

        {section === 'overview' ? (
          <View style={styles.section}>
            {detail.community.welcomeMessage ? (
              <Card style={styles.welcomeCard}>
                <AppText variant="overline" tone="brand">
                  Welcome
                </AppText>

                <AppText variant="subheading">Welcome to the community</AppText>

                <AppText tone="secondary">{detail.community.welcomeMessage}</AppText>
              </Card>
            ) : null}

            <View style={styles.sectionHeader}>
              <AppText variant="subheading">Community tools</AppText>

              <AppText variant="caption" tone="secondary">
                {detail.enabledFeatures.length} enabled
              </AppText>
            </View>

            <View style={styles.featureGrid}>
              {detail.enabledFeatures.map((feature) =>
                feature === 'Marketplace' ? (
                  <Pressable
                    key={feature}
                    accessibilityRole="button"
                    accessibilityLabel="Open Marketplace"
                    onPress={() => {
                      navigation.navigate('App', {
                        screen: 'Marketplace',
                      });
                    }}
                  >
                    <Card variant="muted" style={styles.featureCard}>
                      <AppText variant="caption" tone="brand">
                        Enabled
                      </AppText>

                      <AppText variant="bodyStrong">{feature}</AppText>
                    </Card>
                  </Pressable>
                ) : (
                  <Card key={feature} variant="muted" style={styles.featureCard}>
                    <AppText variant="caption" tone="brand">
                      Enabled
                    </AppText>

                    <AppText variant="bodyStrong">{feature}</AppText>
                  </Card>
                ),
              )}
            </View>

            <Card style={styles.snapshotCard}>
              <AppText variant="subheading">Community snapshot</AppText>

              <View style={styles.snapshotRows}>
                <View style={styles.snapshotRow}>
                  <AppText tone="secondary">Category</AppText>

                  <AppText variant="bodyStrong">
                    {detail.community.category.replaceAll('_', ' ').toLowerCase()}
                  </AppText>
                </View>

                <View style={styles.snapshotRow}>
                  <AppText tone="secondary">Joining</AppText>

                  <AppText variant="bodyStrong">
                    {detail.community.joinPolicy.replaceAll('_', ' ').toLowerCase()}
                  </AppText>
                </View>

                <View style={styles.snapshotRow}>
                  <AppText tone="secondary">Location</AppText>

                  <AppText variant="bodyStrong">
                    {[detail.community.city, detail.community.postcode]
                      .filter(Boolean)
                      .join(' · ') || 'Not set'}
                  </AppText>
                </View>

                <View style={styles.snapshotRow}>
                  <AppText tone="secondary">Your status</AppText>

                  <AppText variant="bodyStrong">
                    {detail.membership?.status === 'INVITED'
                      ? 'Pending approval'
                      : (detail.roleLabel ?? 'Not connected')}
                  </AppText>
                </View>
              </View>
            </Card>
          </View>
        ) : null}

        {section === 'feed' ? (
          <View style={styles.section}>
            {detail.membership?.status === 'ACTIVE' && detail.community.allowMemberPosts ? (
              <CommunityPostComposer
                canPin={
                  detail.membership.role === 'OWNER' ||
                  detail.membership.role === 'ADMIN' ||
                  detail.membership.role === 'MODERATOR'
                }
                communityId={detail.community.id}
                communityName={detail.community.name}
                onCreated={detail.prependPost}
              />
            ) : detail.membership?.status === 'INVITED' ? (
              <Card variant="muted" style={styles.feedNotice}>
                <AppText variant="bodyStrong">Membership pending</AppText>

                <AppText variant="caption" tone="secondary">
                  You can publish once your membership is approved.
                </AppText>
              </Card>
            ) : !detail.membership ? (
              <Card variant="muted" style={styles.feedNotice}>
                <AppText variant="bodyStrong">Join to contribute</AppText>

                <AppText variant="caption" tone="secondary">
                  Join this community to post, comment and take part.
                </AppText>
              </Card>
            ) : !detail.community.allowMemberPosts ? (
              <Card variant="muted" style={styles.feedNotice}>
                <AppText variant="bodyStrong">Owner publishing only</AppText>

                <AppText variant="caption" tone="secondary">
                  Only community managers can publish here at the moment.
                </AppText>
              </Card>
            ) : null}
            <View style={styles.sectionHeader}>
              <AppText variant="subheading">Community feed</AppText>

              <AppText variant="caption" tone="secondary">
                {detail.posts.length} posts
              </AppText>
            </View>

            <FeedList posts={detail.posts} />
          </View>
        ) : null}

        {section === 'events' ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AppText variant="subheading">Community events</AppText>

              <AppText variant="caption" tone="secondary">
                {detail.events.length}
              </AppText>
            </View>

            {detail.community.allowEvents &&
            detail.membership &&
            ['OWNER', 'ADMIN', 'MODERATOR'].includes(detail.membership.role) ? (
              <Pressable
                accessibilityLabel="Create community event"
                accessibilityRole="button"
                onPress={() => {
                  navigation.navigate('CreateEvent', {
                    communityId: detail.community!.id,
                    communitySlug: detail.community!.slug,
                    communityName: detail.community!.name,
                  });
                }}
                style={[
                  styles.createEventButton,
                  {
                    backgroundColor: theme.colors.primary,
                    borderRadius: theme.radius.lg,
                  },
                ]}
              >
                <View style={styles.createEventCopy}>
                  <AppText variant="bodyStrong" tone="inverse">
                    Create event
                  </AppText>

                  <AppText variant="caption" tone="inverse">
                    Publish something for your neighbours
                  </AppText>
                </View>

                <AppText variant="heading" tone="inverse">
                  +
                </AppText>
              </Pressable>
            ) : null}

            {detail.events.length ? (
              <View style={styles.cards}>
                {detail.events.map((event) => (
                  <CommunityEventCard
                    key={event.id}
                    event={event}
                    onPress={() => {
                      navigation.navigate('EventDetail', {
                        eventId: event.id,
                      });
                    }}
                  />
                ))}
              </View>
            ) : (
              <Card variant="muted" style={styles.empty}>
                <AppText variant="subheading">No events scheduled</AppText>

                <AppText tone="secondary">Upcoming community events will appear here.</AppText>
              </Card>
            )}
          </View>
        ) : null}

        {section === 'businesses' ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AppText variant="subheading">Local businesses</AppText>

              <AppText variant="caption" tone="secondary">
                {detail.businesses.length}
              </AppText>
            </View>

            {detail.community.allowBusinesses && detail.membership?.status === 'ACTIVE' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Create business"
                onPress={() => {
                  navigation.navigate('CreateBusiness', {
                    communityId: detail.community.id,
                    communitySlug: detail.community.slug,
                    communityName: detail.community.name,
                  });
                }}
                style={[
                  styles.createEventButton,
                  {
                    backgroundColor: theme.colors.primary,
                    borderRadius: theme.radius.lg,
                  },
                ]}
              >
                <View style={styles.createEventCopy}>
                  <AppText variant="bodyStrong" tone="inverse">
                    Create business
                  </AppText>

                  <AppText variant="caption" tone="inverse">
                    Add a local business profile to this community
                  </AppText>
                </View>

                <AppText variant="heading" tone="inverse">
                  +
                </AppText>
              </Pressable>
            ) : null}

            {detail.businesses.length ? (
              <View style={styles.cards}>
                {detail.businesses.map((business) => (
                  <CommunityBusinessCard
                    key={business.id}
                    business={business}
                    onPress={() => {
                      navigation.navigate('BusinessDetail', {
                        business,
                      });
                    }}
                  />
                ))}
              </View>
            ) : (
              <Card variant="muted" style={styles.empty}>
                <AppText variant="subheading">No businesses listed</AppText>

                <AppText tone="secondary">Connected local businesses will appear here.</AppText>
              </Card>
            )}
          </View>
        ) : null}

        {section === 'about' ? (
          <View style={styles.section}>
            <Card style={styles.about}>
              <AppText variant="subheading">About this community</AppText>

              <AppText tone="secondary">
                {detail.community.description ?? 'No community description has been added yet.'}
              </AppText>

              <View style={styles.aboutRows}>
                <View style={styles.aboutRow}>
                  <AppText tone="secondary">Handle</AppText>

                  <AppText variant="bodyStrong">@{detail.community.handle}</AppText>
                </View>

                <View style={styles.aboutRow}>
                  <AppText tone="secondary">Visibility</AppText>

                  <AppText variant="bodyStrong">{detail.community.visibility}</AppText>
                </View>

                <View style={styles.aboutRow}>
                  <AppText tone="secondary">Members</AppText>

                  <AppText variant="bodyStrong">{detail.community.memberCount}</AppText>
                </View>

                <View style={styles.aboutRow}>
                  <AppText tone="secondary">Your role</AppText>

                  <AppText variant="bodyStrong">{detail.roleLabel ?? 'Not joined'}</AppText>
                </View>
              </View>

              {detail.community.tags.length > 0 ? (
                <View style={styles.tagList}>
                  {detail.community.tags.map((tag) => (
                    <View
                      key={tag}
                      style={[
                        styles.tag,
                        {
                          backgroundColor: theme.colors.primarySoft,
                          borderRadius: theme.radius.pill,
                        },
                      ]}
                    >
                      <AppText variant="caption" tone="brand">
                        #{tag}
                      </AppText>
                    </View>
                  ))}
                </View>
              ) : null}

              {detail.community.rules.length > 0 ? (
                <View style={styles.rules}>
                  <AppText variant="subheading">Community rules</AppText>

                  {detail.community.rules.map((rule, index) => (
                    <View key={`${rule}-${index}`} style={styles.rule}>
                      <View
                        style={[
                          styles.ruleNumber,
                          {
                            backgroundColor: theme.colors.primarySoft,
                            borderRadius: theme.radius.pill,
                          },
                        ]}
                      >
                        <AppText variant="caption" tone="brand">
                          {index + 1}
                        </AppText>
                      </View>

                      <AppText tone="secondary" style={styles.ruleCopy}>
                        {rule}
                      </AppText>
                    </View>
                  ))}
                </View>
              ) : null}
            </Card>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loading: {
    alignItems: 'center',
    flex: 1,
    gap: 14,
    justifyContent: 'center',
  },
  failure: {
    flex: 1,
    gap: 14,
    justifyContent: 'center',
    padding: 24,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    minHeight: 58,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  back: {
    alignItems: 'center',
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  topCopy: {
    flex: 1,
    gap: 1,
  },
  content: {
    gap: 18,
    paddingBottom: 56,
    paddingHorizontal: 16,
  },
  errorCard: {
    gap: 8,
  },
  tabs: {
    gap: 8,
  },
  tab: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  section: {
    gap: 13,
  },
  feedNotice: {
    gap: 6,
  },
  welcomeCard: {
    gap: 8,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  featureCard: {
    gap: 3,
    paddingVertical: 13,
    width: '48%',
  },
  snapshotCard: {
    gap: 12,
  },
  snapshotRows: {
    gap: 10,
  },
  snapshotRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  createEventButton: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 76,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  createEventCopy: {
    flex: 1,
    gap: 3,
  },
  cards: {
    gap: 11,
  },
  empty: {
    gap: 6,
    paddingVertical: 18,
  },
  about: {
    gap: 14,
  },
  aboutRows: {
    gap: 12,
  },
  aboutRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  rules: {
    gap: 12,
  },
  rule: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
  },
  ruleNumber: {
    alignItems: 'center',
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  ruleCopy: {
    flex: 1,
  },
});
