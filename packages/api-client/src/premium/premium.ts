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

export interface PrioritySupportRequestResponse {
  id: string;
  subject: string;
  priority: boolean;
  status: string;
  createdAt: string;
}

export function submitPrioritySupportRequest(input: {
  subject: string;
  message: string;
}): Promise<PrioritySupportRequestResponse> {
  return apiRequest<PrioritySupportRequestResponse>('/premium/support', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
