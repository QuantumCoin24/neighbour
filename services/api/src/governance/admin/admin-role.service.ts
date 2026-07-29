import { Injectable } from '@nestjs/common';

import type { AdminRoleEntity } from './admin-role.entity';


@Injectable()
export class AdminRoleService {

  private roles:
    AdminRoleEntity[] = [];


  create(
    role: AdminRoleEntity,
  ): AdminRoleEntity {

    this.roles.push(role);

    return role;
  }


  list(): AdminRoleEntity[] {
    return this.roles;
  }

}
