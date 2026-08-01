import type { PlatformRole, UserStatus } from '../../generated/prisma/client.js';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: PlatformRole;
  status: UserStatus;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
