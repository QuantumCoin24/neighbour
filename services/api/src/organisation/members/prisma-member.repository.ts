import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';

import type { OrganisationMemberEntity } from './member.entity';

import { OrganisationMemberRepository } from './member.repository';

@Injectable()
export class PrismaOrganisationMemberRepository extends OrganisationMemberRepository {
  constructor(private readonly database: DatabaseService) {
    super();
  }

  private map(record: any): OrganisationMemberEntity {
    return {
      id: record.id,

      organisationId: record.organisationId,

      userId: record.userId,

      role: record.role,

      createdAt: record.createdAt,
    };
  }

  async save(member: OrganisationMemberEntity): Promise<OrganisationMemberEntity> {
    const record = await this.database.organisationMember.create({
      data: {
        id: member.id,

        organisationId: member.organisationId,

        userId: member.userId,

        role: member.role,
      },
    });

    return this.map(record);
  }

  async findByOrganisation(organisationId: string): Promise<OrganisationMemberEntity[]> {
    const records = await this.database.organisationMember.findMany({
      where: {
        organisationId,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

    return records.map((record) => this.map(record));
  }

  async findByUser(userId: string): Promise<OrganisationMemberEntity[]> {
    const records = await this.database.organisationMember.findMany({
      where: {
        userId,
      },
    });

    return records.map((record) => this.map(record));
  }

  async remove(organisationId: string, userId: string): Promise<void> {
    await this.database.organisationMember.delete({
      where: {
        organisationId_userId: {
          organisationId,
          userId,
        },
      },
    });
  }
}
