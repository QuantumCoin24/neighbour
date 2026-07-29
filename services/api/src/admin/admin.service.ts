import { Injectable } from '@nestjs/common';

import type { RoleEntity } from './role.entity';
import type { PermissionEntity } from './permission.entity';

@Injectable()
export class AdminService {
  private roles: RoleEntity[] = [];
  private permissions: PermissionEntity[] = [];

  createRole(role: RoleEntity): RoleEntity {
    this.roles.push(role);

    return role;
  }

  createPermission(permission: PermissionEntity): PermissionEntity {
    this.permissions.push(permission);

    return permission;
  }

  listRoles(): RoleEntity[] {
    return this.roles;
  }
}
