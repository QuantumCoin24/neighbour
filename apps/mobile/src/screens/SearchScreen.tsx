import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppText, Card, Screen } from '../components';
import {
  SearchCategoryBar,
  SearchResultCard,
  SearchResultSection,
  useSearchController,
} from '../features/search';
import { useNeighbourTheme } from '../theme';

function formatEventDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Event date unavailable';
  }

  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function createPostDescription(content: string): string {
  const value = content.trim();

  return value.length > 150 ? `${value.slice(0, 147)}…` : value;
}

export default function SearchScreen() {
  const { theme } = useNeighbourTheme();
  const search = useSearchController();

  const showPeople = search.category === 'all' || search.category === 'people';
  const showCommunities = search.category === 'all' || search.category === 'communities';
  const showNeighbourhoods = search.category === 'all' || search.category === 'neighbourhoods';
  const showEvents = search.category === 'all' || search.category === 'events';
  const showPosts = search.category === 'all' || search.category === 'posts';

  const hasQuery = search.query.trim().length > 0;
  const hasSearched = search.searchedQuery.trim().length > 0;
  const hasResults = search.counts.all > 0;

  return (
    <Screen
      contentStyle={styles.screen}
      refreshControl={
        <RefreshControl
          enabled={hasSearched}
          refreshing={search.refreshing}
          onRefresh={() => {
            void search.refresh();
          }}
          tintColor={theme.colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <AppText variant="overline" tone="brand">
          Universal discovery
        </AppText>

        <AppText variant="title">Search Neighbour</AppText>

        <AppText variant="bodyLarge" tone="secondary">
          Find people, communities, local places, events and conversations across your
          neighbourhood.
        </AppText>
      </View>

      <View
        style={[
          styles.searchField,
          {
            backgroundColor: theme.colors.surface,
            borderColor: search.error ? theme.colors.danger : theme.colors.borderStrong,
            borderRadius: theme.radius.xl,
          },
          theme.shadows.subtle,
        ]}
      >
        <AppText
          style={{
            color: theme.colors.primary,
            fontSize: 21,
          }}
        >
          ⌕
        </AppText>

        <TextInput
          accessibilityLabel="Search Neighbour"
          autoCapitalize="none"
          autoCorrect={false}
          enterKeyHint="search"
          onChangeText={search.setQuery}
          onSubmitEditing={search.submit}
          placeholder="People, places, posts and events"
          placeholderTextColor={theme.colors.textMuted}
          returnKeyType="search"
          selectionColor={theme.colors.primary}
          style={[
            styles.input,
            {
              color: theme.colors.text,
            },
          ]}
          value={search.query}
        />

        {search.loading ? (
          <ActivityIndicator color={theme.colors.primary} size="small" />
        ) : hasQuery ? (
          <Pressable
            accessibilityLabel="Clear search"
            accessibilityRole="button"
            onPress={search.clearQuery}
            style={({ pressed }) => [
              styles.clearButton,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderRadius: theme.radius.pill,
                opacity: pressed ? 0.65 : 1,
              },
            ]}
          >
            <AppText variant="caption" tone="secondary">
              ×
            </AppText>
          </Pressable>
        ) : null}
      </View>

      {!hasQuery ? (
        <View style={styles.initial}>
          <Card
            style={[
              styles.discoveryCard,
              {
                backgroundColor: theme.colors.primaryStrong,
              },
            ]}
          >
            <View style={styles.discoveryCopy}>
              <AppText variant="overline" tone="inverse">
                Search everything local
              </AppText>

              <AppText variant="heading" tone="inverse">
                Your neighbourhood, in one place.
              </AppText>

              <AppText tone="inverse">
                Begin typing to discover people, communities, posts, events and nearby places.
              </AppText>
            </View>

            <AppText tone="inverse" style={styles.discoverySymbol}>
              ⌖
            </AppText>
          </Card>

          {search.history.length > 0 ? (
            <View style={styles.history}>
              <View style={styles.sectionHeader}>
                <View>
                  <AppText variant="subheading">Recent searches</AppText>

                  <AppText variant="caption" tone="secondary">
                    Stored securely on this device.
                  </AppText>
                </View>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    void search.clearHistory();
                  }}
                >
                  <AppText variant="caption" tone="brand">
                    Clear
                  </AppText>
                </Pressable>
              </View>

              <View style={styles.historyItems}>
                {search.history.map((item) => (
                  <View
                    key={item}
                    style={[
                      styles.historyItem,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                        borderRadius: theme.radius.pill,
                      },
                    ]}
                  >
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        search.selectHistoryItem(item);
                      }}
                      style={styles.historyMain}
                    >
                      <AppText tone="brand">⌕</AppText>

                      <AppText variant="caption" numberOfLines={1} style={styles.historyLabel}>
                        {item}
                      </AppText>
                    </Pressable>

                    <Pressable
                      accessibilityLabel={`Remove ${item} from recent searches`}
                      accessibilityRole="button"
                      onPress={() => {
                        void search.removeHistoryItem(item);
                      }}
                      style={styles.historyRemove}
                    >
                      <AppText variant="caption" tone="muted">
                        ×
                      </AppText>
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          ) : !search.historyLoading ? (
            <Card variant="muted" style={styles.tipCard}>
              <AppText variant="subheading">Start exploring</AppText>

              <AppText tone="secondary">
                Search for a neighbour, community, postcode area, event or local discussion.
              </AppText>
            </Card>
          ) : null}
        </View>
      ) : null}

      {hasQuery && search.query.trim().length < search.minimumQueryLength ? (
        <Card variant="muted" style={styles.messageCard}>
          <AppText variant="subheading">Keep typing</AppText>

          <AppText tone="secondary">Enter at least two characters to search Neighbour.</AppText>
        </Card>
      ) : null}

      {hasSearched ? (
        <SearchCategoryBar
          counts={search.counts}
          onSelect={search.setCategory}
          selected={search.category}
        />
      ) : null}

      {search.error ? (
        <Card
          variant="muted"
          style={[
            styles.messageCard,
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
            Search unavailable
          </AppText>

          <AppText tone="secondary">{search.error}</AppText>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void search.retry();
            }}
          >
            <AppText variant="label" tone="brand">
              Try again
            </AppText>
          </Pressable>
        </Card>
      ) : null}

      {hasSearched && !search.loading && !search.error && !hasResults ? (
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
                color: theme.colors.primary,
                fontSize: 26,
              }}
            >
              ⌕
            </AppText>
          </View>

          <View style={styles.emptyCopy}>
            <AppText variant="subheading">No matches found</AppText>

            <AppText tone="secondary">Try a different name, place or keyword.</AppText>
          </View>
        </Card>
      ) : null}

      {hasResults ? (
        <View style={styles.results}>
          <View style={styles.resultSummary}>
            <AppText variant="subheading">Results</AppText>

            <AppText variant="caption" tone="secondary">
              {search.counts.all} matches for “{search.searchedQuery}”
            </AppText>
          </View>

          {showPeople ? (
            <SearchResultSection count={search.results.users.length} symbol="◉" title="People">
              {search.results.users.map((person) => (
                <SearchResultCard
                  key={person.id}
                  accent="primary"
                  description="Neighbour member"
                  metadata="View identity"
                  symbol="◉"
                  title={person.displayName}
                  onPress={() => {
                    search.selectHistoryItem(search.searchedQuery);
                  }}
                />
              ))}
            </SearchResultSection>
          ) : null}

          {showCommunities ? (
            <SearchResultSection
              count={search.results.communities.length}
              symbol="◎"
              title="Communities"
            >
              {search.results.communities.map((community) => (
                <SearchResultCard
                  key={community.id}
                  accent="community"
                  description={`@${community.slug}`}
                  metadata="Open community"
                  symbol="◎"
                  title={community.name}
                  onPress={() => {
                    search.selectHistoryItem(search.searchedQuery);
                  }}
                />
              ))}
            </SearchResultSection>
          ) : null}

          {showNeighbourhoods ? (
            <SearchResultSection
              count={search.results.neighbourhoods.length}
              symbol="⌖"
              title="Neighbourhoods"
            >
              {search.results.neighbourhoods.map((neighbourhood) => (
                <SearchResultCard
                  key={neighbourhood.id}
                  accent="information"
                  description={neighbourhood.localArea ?? 'Local neighbourhood'}
                  metadata="Explore local area"
                  symbol="⌖"
                  title={neighbourhood.name}
                  onPress={() => {
                    search.selectHistoryItem(search.searchedQuery);
                  }}
                />
              ))}
            </SearchResultSection>
          ) : null}

          {showEvents ? (
            <SearchResultSection count={search.results.events.length} symbol="◇" title="Events">
              {search.results.events.map((event) => (
                <SearchResultCard
                  key={event.id}
                  accent="event"
                  description={event.community?.name ?? 'Neighbour event'}
                  metadata={formatEventDate(event.startsAt)}
                  symbol="◇"
                  title={event.title}
                  onPress={() => {
                    search.selectHistoryItem(search.searchedQuery);
                  }}
                />
              ))}
            </SearchResultSection>
          ) : null}

          {showPosts ? (
            <SearchResultSection count={search.results.posts.length} symbol="▤" title="Posts">
              {search.results.posts.map((post) => (
                <SearchResultCard
                  key={post.id}
                  accent="business"
                  description={createPostDescription(post.content)}
                  metadata="Open discussion"
                  symbol="▤"
                  title={post.title?.trim() || 'Community post'}
                  onPress={() => {
                    search.selectHistoryItem(search.searchedQuery);
                  }}
                />
              ))}
            </SearchResultSection>
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 22,
    paddingBottom: 42,
  },
  header: {
    gap: 10,
  },
  searchField: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    minHeight: 60,
    paddingHorizontal: 17,
  },
  input: {
    flex: 1,
    fontSize: 16,
    minHeight: 56,
    paddingVertical: 12,
  },
  clearButton: {
    alignItems: 'center',
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  initial: {
    gap: 28,
  },
  discoveryCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 18,
  },
  discoveryCopy: {
    flex: 1,
    gap: 8,
  },
  discoverySymbol: {
    fontSize: 38,
    lineHeight: 44,
    opacity: 0.8,
  },
  history: {
    gap: 14,
  },
  sectionHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  historyItem: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    maxWidth: '100%',
  },
  historyMain: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    maxWidth: 220,
    paddingBottom: 9,
    paddingLeft: 12,
    paddingTop: 9,
  },
  historyLabel: {
    flexShrink: 1,
  },
  historyRemove: {
    paddingBottom: 9,
    paddingHorizontal: 10,
    paddingTop: 9,
  },
  tipCard: {
    gap: 8,
  },
  messageCard: {
    gap: 10,
  },
  emptyCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 15,
  },
  emptyIcon: {
    alignItems: 'center',
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  emptyCopy: {
    flex: 1,
    gap: 6,
  },
  results: {
    gap: 30,
  },
  resultSummary: {
    gap: 4,
  },
});
