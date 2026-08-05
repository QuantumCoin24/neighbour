import {
  getMyMarketplaceBusiness,
  searchMarketplaceBusinesses,
  type MarketplaceBusiness,
} from '@neighbour/api-client';
import { useCallback, useEffect, useMemo, useState } from 'react';

const CATEGORIES = [
  'All',
  'Food',
  'Trades',
  'Health',
  'Pets',
  'Shopping',
  'Education',
  'Automotive',
  'Professional',
  'Entertainment',
] as const;

export function useMarketplace() {
  const [businesses, setBusinesses] = useState<MarketplaceBusiness[]>([]);
  const [myBusiness, setMyBusiness] = useState<MarketplaceBusiness | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const [results, mine] = await Promise.all([
          searchMarketplaceBusinesses(query.trim()),
          getMyMarketplaceBusiness().catch(() => null),
        ]);

        setBusinesses(results);
        setMyBusiness(mine);
      } catch {
        setError('Marketplace businesses could not be loaded.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [query],
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

  const filteredBusinesses = useMemo(() => {
    if (category === 'All') {
      return businesses;
    }

    return businesses.filter(
      (business) => business.category.toLocaleLowerCase() === category.toLocaleLowerCase(),
    );
  }, [businesses, category]);

  return {
    categories: CATEGORIES,
    businesses: filteredBusinesses,
    myBusiness,
    query,
    category,
    loading,
    refreshing,
    error,
    setQuery,
    setCategory,
    refresh: () => load(true),
    retry: () => load(false),
  };
}
