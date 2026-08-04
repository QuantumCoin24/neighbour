import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';

import type { OrganisationPermissionEntity } from './permission.entity';

import { OrganisationPermissionRepository } from './permission.repository';

@Injectable()
export class PrismaOrganisationPermissionRepository extends OrganisationPermissionRepository {
  constructor(private readonly database: DatabaseService) {
    super();
  }

  private map(record: any): OrganisationPermissionEntity {
    return {
      id: record.id,

      roleId: record.roleId,

      name: record.name,

      createdAt: record.createdAt,
    };
  }

  async save(permission: OrganisationPermissionEntity): Promise<OrganisationPermissionEntity> {
    const record = await this.database.organisationPermission.create({
      data: {
        id: permission.id,

        roleId: permission.roleId,

        name: permission.name,
      },
    });

    return this.map(record);
  }

  async findByRole(roleId: string): Promise<OrganisationPermissionEntity[]> {
    const records = await this.database.organisationPermission.findMany({
      where: {
        roleId,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

    return records.map((record) => this.map(record));
  }
}
