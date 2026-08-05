import { apiRequest } from '../client';

import type { PremiumOverview, PremiumPlan, PremiumPlanId } from './types';

export function getPremiumPlans(): Promise<PremiumPlan[]> {
  return apiRequest<PremiumPlan[]>('/premium/plans');
}

export function getMyPremiumOverview(): Promise<PremiumOverview> {
  return apiRequest<PremiumOverview>('/premium/me');
}

export function activateInternalPremiumPlan(plan: PremiumPlanId): Promise<PremiumOverview> {
  return apiRequest<PremiumOverview>('/premium/me/internal-plan', {
    method: 'PATCH',
    body: JSON.stringify({
      plan,
    }),
  });
}
