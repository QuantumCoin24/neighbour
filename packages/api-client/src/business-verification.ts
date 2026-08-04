import { apiRequest } from './client';

export interface BusinessVerification {
  id: string;

  businessId: string;

  status: string;

  notes: string | null;

  submittedAt: string;

  reviewedAt: string | null;
}

export function submitBusinessVerification(
  businessId: string,
  data: {
    notes?: string;
  },
) {
  return apiRequest<BusinessVerification>(`/businesses/${businessId}/verification`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getBusinessVerification(businessId: string) {
  return apiRequest<BusinessVerification | null>(`/businesses/${businessId}/verification`);
}
