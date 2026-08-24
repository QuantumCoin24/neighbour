import { getVibesFeed, type Vibe, type VibeFeedMode } from '@neighbour/api-client';
import { useCallback, useEffect, useMemo, useState } from 'react';

const PAGE_SIZE = 10;

export function useVibesFeed(mode: VibeFeedMode = 'FOR_YOU') {
  const [items, setItems] = useState<Vibe[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getVibesFeed({
        limit: PAGE_SIZE,
        mode,
      });

      setItems(response.items);
      setNextCursor(response.nextCursor);
    } catch {
      setItems([]);
      setNextCursor(null);
      setError('Vibes could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [mode]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    try {
      const response = await getVibesFeed({
        limit: PAGE_SIZE,
        mode,
      });

      setItems(response.items);
      setNextCursor(response.nextCursor);
    } catch {
      setError('Vibes could not be refreshed.');
    } finally {
      setRefreshing(false);
    }
  }, [mode]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) {
      return;
    }

    setLoadingMore(true);

    try {
      const response = await getVibesFeed({
        cursor: nextCursor,
        limit: PAGE_SIZE,
        mode,
      });

      setItems((current) => {
        const known = new Set(current.map((item) => item.id));

        return [...current, ...response.items.filter((item) => !known.has(item.id))];
      });

      setNextCursor(response.nextCursor);
    } catch {
      // Pagination failure must not destroy feed.
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, mode, nextCursor]);

  const replaceItem = useCallback((next: Vibe) => {
    setItems((current) => current.map((item) => (item.id === next.id ? next : item)));
  }, []);

  useEffect(() => {
    setItems([]);
    setNextCursor(null);

    void loadInitial();
  }, [loadInitial]);

  return useMemo(
    () => ({
      items,
      loading,
      refreshing,
      loadingMore,
      error,
      hasMore: Boolean(nextCursor),
      mode,
      refresh,
      loadMore,
      replaceItem,
    }),
    [
      error,
      items,
      loadMore,
      loading,
      loadingMore,
      mode,
      nextCursor,
      refresh,
      refreshing,
      replaceItem,
    ],
  );
}
