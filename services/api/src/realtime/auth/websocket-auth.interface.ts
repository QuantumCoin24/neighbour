import type { AuthUser } from '../../auth/interfaces/auth-user.interface';

export interface WebSocketAuthenticationResult {
  token: string;
  user: AuthUser;
}
