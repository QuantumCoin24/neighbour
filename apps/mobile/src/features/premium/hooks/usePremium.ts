import {
  activateInternalPremiumPlan,
  getMyPremiumOverview,
  getPremiumPlans,
  type PremiumOverview,
  type PremiumPlan,
  type PremiumPlanId,
} from '@neighbour/api-client';
import { useCallback, useEffect, useState } from 'react';

export function usePremium() {
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [overview, setOverview] = useState<PremiumOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activating, setActivating] = useState<PremiumPlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const [planResult, overviewResult] = await Promise.all([
        getPremiumPlans(),
        getMyPremiumOverview(),
      ]);

      setPlans(planResult);
      setOverview(overviewResult);
    } catch {
      setError('Premium information could not be loaded.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activate = useCallback(async (plan: PremiumPlanId) => {
    setActivating(plan);
    setError(null);

    try {
      const result = await activateInternalPremiumPlan(plan);

      setOverview(result);
    } catch {
      setError('The selected plan could not be activated.');
    } finally {
      setActivating(null);
    }
  }, []);

  return {
    plans,
    overview,
    loading,
    refreshing,
    activating,
    error,
    refresh: () => load(true),
    retry: () => load(false),
    activate,
  };
}
