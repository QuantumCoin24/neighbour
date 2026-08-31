import { apiRequest } from './client';

export interface BusinessVerification {
  id: string;

  businessId: string;

  status: string;

  notes: string | null;

  submittedAt: string;

  reviewedAt: string | null;
}

export interface BusinessVerificationQueueItem
  extends BusinessVerification {
  business: {
    id: string;
    communityId: string;
    ownerId: string;
    name: string;
    description: string;
    category: string;
    verified: boolean;
  };
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

export function getBusinessVerificationQueue(status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';

  return apiRequest<BusinessVerificationQueueItem[]>(`/businesses/verifications${query}`);
}

export function reviewBusinessVerification(
  businessId: string,
  data: {
    status: 'APPROVED' | 'REJECTED';
    notes?: string;
  },
) {
  return apiRequest<BusinessVerification>(`/businesses/${businessId}/verification`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
