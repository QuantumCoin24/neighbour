import { Injectable } from '@nestjs/common';

import type { PermissionEntity } from './permission.entity';

@Injectable()
export class AccessService {
  private permissions: PermissionEntity[] = [];

  grant(permission: PermissionEntity): PermissionEntity {
    this.permissions.push(permission);

    return permission;
  }

  canAccess(subjectId: string, resource: string, action: string): boolean {
    return this.permissions.some(
      (permission) =>
        permission.subjectId === subjectId &&
        permission.resource === resource &&
        permission.action === action &&
        permission.granted,
    );
  }
}
