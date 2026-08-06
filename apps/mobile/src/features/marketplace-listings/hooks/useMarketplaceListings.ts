import {
  searchMarketplaceListings,
  type MarketplaceListing,
  type MarketplaceListingCategory,
} from '@neighbour/api-client';
import { useCallback, useEffect, useState } from 'react';

export function useMarketplaceListings() {
  const [items, setItems] = useState<MarketplaceListing[]>([]);

  const [query, setQuery] = useState('');

  const [category, setCategory] = useState<MarketplaceListingCategory | undefined>(undefined);

  const [freeOnly, setFreeOnly] = useState(false);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [loadingMore, setLoadingMore] = useState(false);

  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (refresh = false, cursor?: string) => {
      if (cursor) {
        setLoadingMore(true);
      } else if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const page = await searchMarketplaceListings({
          ...(query.trim()
            ? {
                query: query.trim(),
              }
            : {}),
          ...(category
            ? {
                category,
              }
            : {}),
          ...(freeOnly
            ? {
                freeOnly: true,
              }
            : {}),
          limit: 24,
          ...(cursor
            ? {
                cursor,
              }
            : {}),
        });

        setItems((current) => (cursor ? [...current, ...page.items] : page.items));

        setNextCursor(page.nextCursor);
      } catch {
        setError('Community listings could not be loaded.');
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [category, freeOnly, query],
  );

  useEffect(() => {
    const timer = setTimeout(
      () => {
        void load();
      },
      query.trim() ? 300 : 0,
    );

    return () => {
      clearTimeout(timer);
    };
  }, [load, query]);

  return {
    category,
    error,
    freeOnly,
    items,
    loading,
    loadingMore,
    nextCursor,
    query,
    refreshing,
    setCategory,
    setFreeOnly,
    setQuery,
    refresh: () => load(true),
    retry: () => load(false),
    loadMore: () => (nextCursor ? load(false, nextCursor) : Promise.resolve()),
  };
}
