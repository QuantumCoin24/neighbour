import {
  getVibesFeed,
  type Vibe,
} from '@neighbour/api-client';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

const PAGE_SIZE = 10;

export function useVibesFeed() {
  const [items, setItems] = useState<Vibe[]>([]);
  const [nextCursor, setNextCursor] =
    useState<string | null>(null);

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
      });

      setItems(response.items);
      setNextCursor(response.nextCursor);
    } catch {
      setError('Vibes could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    try {
      const response = await getVibesFeed({
        limit: PAGE_SIZE,
      });

      setItems(response.items);
      setNextCursor(response.nextCursor);
    } catch {
      setError('Vibes could not be refreshed.');
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
      const response = await getVibesFeed({
        cursor: nextCursor,
        limit: PAGE_SIZE,
      });

      setItems((current) => {
        const known = new Set(
          current.map((item) => item.id),
        );

        return [
          ...current,
          ...response.items.filter(
            (item) => !known.has(item.id),
          ),
        ];
      });

      setNextCursor(response.nextCursor);
    } catch {
      // Keep the current Vibes feed intact if pagination fails.
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, nextCursor]);

  const replaceItem = useCallback((next: Vibe) => {
    setItems((current) =>
      current.map((item) =>
        item.id === next.id ? next : item,
      ),
    );
  }, []);

  useEffect(() => {
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
      nextCursor,
      refresh,
      refreshing,
      replaceItem,
    ],
  );
}
