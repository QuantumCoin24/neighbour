import { apiRequest } from './client';

import type { Business } from './business';

export function getMyBusiness() {
  return apiRequest<Business | null>('/businesses/me');
}
