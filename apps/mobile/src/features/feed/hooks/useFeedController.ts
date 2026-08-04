import { getHomeFeed, type FeedPost } from '@neighbour/api-client';
import { useCallback, useEffect, useMemo, useState } from 'react';

export interface FeedControllerState {
  posts: FeedPost[];
  nextCursor: string | null;
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  retry: () => Promise<void>;
}

const PAGE_SIZE = 10;

export function useFeedController(): FeedControllerState {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInitialPage = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getHomeFeed({
        limit: PAGE_SIZE,
      });

      setPosts(response.items);
      setNextCursor(response.nextCursor);
    } catch {
      setError('Unable to load your community feed.');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    try {
      const response = await getHomeFeed({
        limit: PAGE_SIZE,
      });

      setPosts(response.items);
      setNextCursor(response.nextCursor);
    } catch {
      setError('Unable to refresh your community feed.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) {
      return;
    }

    setLoadingMore(true);

    try {
      const response = await getHomeFeed({
        cursor: nextCursor,
        limit: PAGE_SIZE,
      });

      setPosts((currentPosts) => {
        const existingIds = new Set(currentPosts.map((post) => post.id));

        const newPosts = response.items.filter((post) => !existingIds.has(post.id));

        return [...currentPosts, ...newPosts];
      });

      setNextCursor(response.nextCursor);
    } catch {
      setError('Unable to load more posts.');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, nextCursor]);

  useEffect(() => {
    void loadInitialPage();
  }, [loadInitialPage]);

  return useMemo(
    () => ({
      posts,
      nextCursor,
      loading,
      refreshing,
      loadingMore,
      error,
      refresh,
      loadMore,
      retry: loadInitialPage,
    }),
    [
      posts,
      nextCursor,
      loading,
      refreshing,
      loadingMore,
      error,
      refresh,
      loadMore,
      loadInitialPage,
    ],
  );
}
