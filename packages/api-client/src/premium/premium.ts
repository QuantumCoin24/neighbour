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

export type PremiumBillingInterval = 'MONTHLY' | 'ANNUAL';

export interface PremiumStripeCheckoutResponse {
  url: string;
  sessionId: string;
}

export interface PremiumStripePortalResponse {
  url: string;
}

export function createPremiumStripeCheckout(input: {
  plan: Exclude<PremiumPlanId, 'FREE'>;
  interval: PremiumBillingInterval;
}): Promise<PremiumStripeCheckoutResponse> {
  return apiRequest<PremiumStripeCheckoutResponse>('/premium/stripe/checkout', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function confirmPremiumStripeCheckout(sessionId: string): Promise<PremiumOverview> {
  return apiRequest<PremiumOverview>('/premium/stripe/confirm', {
    method: 'POST',
    body: JSON.stringify({
      sessionId,
    }),
  });
}

export function createPremiumStripePortal(): Promise<PremiumStripePortalResponse> {
  return apiRequest<PremiumStripePortalResponse>('/premium/stripe/portal', {
    method: 'POST',
  });
}
