import {
  getMarketplaceBusinessAnalytics,
  getMarketplaceBusinessDashboard,
  type MarketplaceBusinessAnalytics,
  type MarketplaceBusinessDashboard,
  type MarketplaceBusiness,
} from '@neighbour/api-client';
import { useCallback, useEffect, useState } from 'react';

export function useBusinessDetail(business: MarketplaceBusiness) {
  const [dashboard, setDashboard] = useState<MarketplaceBusinessDashboard | null>(null);
  const [analytics, setAnalytics] = useState<MarketplaceBusinessAnalytics | null>(null);
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
        const [dashboardResult, analyticsResult] = await Promise.all([
          getMarketplaceBusinessDashboard(business.id),
          getMarketplaceBusinessAnalytics(business.id).catch(() => null),
        ]);

        setDashboard({
          ...dashboardResult,
          business: dashboardResult.business ?? business,
        });
        setAnalytics(analyticsResult);
      } catch {
        setError('This business profile could not be loaded.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [business],
  );

  useEffect(() => {
    void load();
  }, [load]);

  return {
    dashboard,
    analytics,
    loading,
    refreshing,
    error,
    refresh: () => load(true),
    retry: () => load(false),
  };
}
