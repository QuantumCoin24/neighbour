import { apiRequest } from './index';

import type { Business } from './business';

export function getMyBusiness() {
  return apiRequest<Business | null>('/businesses/me');
}
