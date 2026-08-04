import { apiRequest } from './index';

export interface BusinessEvent {
  id: string;

  businessId: string;

  title: string;

  description: string;

  startsAt: string;

  endsAt: string;

  createdAt: string;
}

export function getDiscoverEvents() {
  return apiRequest<BusinessEvent[]>('/businesses/events/discover');
}
