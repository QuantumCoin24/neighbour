import { Injectable } from '@nestjs/common';

import type { OrganisationPermissionEntity } from './permission.entity';

import { OrganisationPermissionRepository } from './permission.repository';

@Injectable()
export class OrganisationPermissionService {
  constructor(private readonly repository: OrganisationPermissionRepository) {}

  async create(data: { roleId: string; name: string }): Promise<OrganisationPermissionEntity> {
    return this.repository.save({
      id: crypto.randomUUID(),

      roleId: data.roleId,

      name: data.name,

      createdAt: new Date(),
    });
  }

  async findByRole(roleId: string) {
    return this.repository.findByRole(roleId);
  }
}
