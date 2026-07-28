import type { PlatformRole } from '../../generated/prisma/enums.js';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: PlatformRole;
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
  type: 'refresh';
}
