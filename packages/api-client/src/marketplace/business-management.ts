import { apiRequest } from '../client';

import type { BusinessAnalytics, BusinessDashboard, BusinessVerification } from './types';

export function getBusinessDashboard(businessId: string): Promise<BusinessDashboard> {
  return apiRequest<BusinessDashboard>(`/businesses/${encodeURIComponent(businessId)}/dashboard`);
}

export function getBusinessAnalytics(businessId: string): Promise<BusinessAnalytics> {
  return apiRequest<BusinessAnalytics>(`/businesses/${encodeURIComponent(businessId)}/analytics`);
}

export function getBusinessVerification(businessId: string): Promise<BusinessVerification | null> {
  return apiRequest<BusinessVerification | null>(
    `/businesses/${encodeURIComponent(businessId)}/verification`,
  );
}

export function submitBusinessVerification(
  businessId: string,
  notes?: string,
): Promise<BusinessVerification> {
  return apiRequest<BusinessVerification>(
    `/businesses/${encodeURIComponent(businessId)}/verification`,
    {
      method: 'POST',
      body: JSON.stringify({
        ...(notes?.trim() ? { notes: notes.trim() } : {}),
      }),
    },
  );
}
