import type { FeedPost } from '@neighbour/api-client';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card } from '../../components';
import { useNeighbourTheme } from '../../theme';

import { FeedCard } from './FeedCard';
import { FeedEmptyState } from './FeedEmptyState';

interface FeedListProps {
  posts: FeedPost[];
  hasMore?: boolean;
  loadingMore?: boolean;
  error?: string | null;
  onLoadMore?: () => void;
  onRetry?: () => void;
}

export function FeedList({
  posts,
  hasMore = false,
  loadingMore = false,
  error = null,
  onLoadMore,
  onRetry,
}: FeedListProps) {
  const { theme } = useNeighbourTheme();

  if (posts.length === 0) {
    return <FeedEmptyState />;
  }

  return (
    <View style={styles.list}>
      {posts.map((post) => (
        <FeedCard key={post.id} post={post} />
      ))}

      {error ? (
        <Card variant="muted" style={styles.footerMessage}>
          <AppText
            variant="bodyStrong"
            style={{
              color: theme.colors.danger,
            }}
          >
            More local updates are unavailable
          </AppText>

          <AppText variant="caption" tone="secondary">
            {error}
          </AppText>

          {onRetry ? (
            <Pressable
              accessibilityRole="button"
              onPress={onRetry}
              style={({ pressed }) => [
                styles.footerAction,
                {
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <AppText variant="label" tone="brand">
                Try again
              </AppText>
            </Pressable>
          ) : null}
        </Card>
      ) : null}

      {loadingMore ? (
        <View style={styles.loadingFooter}>
          <ActivityIndicator color={theme.colors.primary} size="small" />

          <AppText variant="caption" tone="secondary">
            Loading more activity…
          </AppText>
        </View>
      ) : null}

      {!loadingMore && hasMore && onLoadMore ? (
        <Pressable
          accessibilityRole="button"
          onPress={onLoadMore}
          style={({ pressed }) => [
            styles.loadMoreButton,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.borderStrong,
              borderRadius: theme.radius.lg,
              opacity: pressed ? 0.78 : 1,
            },
            theme.shadows.subtle,
          ]}
        >
          <AppText variant="bodyStrong" tone="brand">
            Show more activity
          </AppText>
        </Pressable>
      ) : null}

      {!hasMore && !loadingMore ? (
        <View style={styles.endMessage}>
          <AppText variant="caption" tone="muted">
            You’re all caught up.
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  footerMessage: {
    gap: 7,
  },
  footerAction: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  loadingFooter: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  loadMoreButton: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  endMessage: {
    alignItems: 'center',
    paddingVertical: 12,
  },
});
