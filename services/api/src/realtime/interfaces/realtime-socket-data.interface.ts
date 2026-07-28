import type { AuthUser } from '../../auth/interfaces/auth-user.interface';

export interface RealtimeSocketData {
  userId?: string;
  user?: AuthUser;
  authenticatedAt?: string;
}
