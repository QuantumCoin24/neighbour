import type { Request } from 'express';

import type { AuthUser } from '../interfaces/auth-user.interface';

export type AuthenticatedRequest = Request & {
  user: AuthUser;
};
