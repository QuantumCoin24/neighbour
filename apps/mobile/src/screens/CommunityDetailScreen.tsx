import type { NativeStackScreenProps } from '@react-navigation/native-stack';
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
import { FeedList } from '../features/feed';
import type { RootStackParamList } from '../navigation/routes';
import { useNeighbourTheme } from '../theme';

type CommunityDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'CommunityDetail'>;

const SECTIONS: {
  id: CommunityDetailSection;
  label: string;
}[] = [
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

  const [section, setSection] = React.useState<CommunityDetailSection>('feed');

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
            @{detail.community.slug}
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
          membership={detail.membership}
          onJoin={() => {
            void detail.join();
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

        {section === 'feed' ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AppText variant="subheading">Community Feed</AppText>

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
              <AppText variant="subheading">Community Events</AppText>

              <AppText variant="caption" tone="secondary">
                {detail.events.length}
              </AppText>
            </View>

            {detail.events.length ? (
              <View style={styles.cards}>
                {detail.events.map((event) => (
                  <CommunityEventCard key={event.id} event={event} />
                ))}
              </View>
            ) : (
              <Card variant="muted" style={styles.empty}>
                <AppText variant="subheading">No events scheduled</AppText>

                <AppText tone="secondary">New community events will appear here.</AppText>
              </Card>
            )}
          </View>
        ) : null}

        {section === 'businesses' ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AppText variant="subheading">Local Businesses</AppText>

              <AppText variant="caption" tone="secondary">
                {detail.businesses.length}
              </AppText>
            </View>

            {detail.businesses.length ? (
              <View style={styles.cards}>
                {detail.businesses.map((business) => (
                  <CommunityBusinessCard key={business.id} business={business} />
                ))}
              </View>
            ) : (
              <Card variant="muted" style={styles.empty}>
                <AppText variant="subheading">No businesses listed</AppText>

                <AppText tone="secondary">Verified local businesses will appear here.</AppText>
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
            </Card>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const React = require('react') as typeof import('react');

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
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  back: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  topCopy: {
    flex: 1,
    gap: 1,
  },
  content: {
    gap: 22,
    paddingBottom: 50,
    paddingHorizontal: 18,
  },
  errorCard: {
    gap: 8,
  },
  tabs: {
    gap: 8,
  },
  tab: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 15,
    paddingVertical: 9,
  },
  section: {
    gap: 14,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cards: {
    gap: 11,
  },
  empty: {
    gap: 8,
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
    justifyContent: 'space-between',
  },
});
