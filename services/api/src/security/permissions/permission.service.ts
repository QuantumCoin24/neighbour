import { Injectable } from '@nestjs/common';

import type { PermissionEntity } from './permission.entity';

@Injectable()
export class PermissionService {
  private permissions: PermissionEntity[] = [];

  create(permission: PermissionEntity): PermissionEntity {
    this.permissions.push(permission);

    return permission;
  }

  list(): PermissionEntity[] {
    return this.permissions;
  }
}
