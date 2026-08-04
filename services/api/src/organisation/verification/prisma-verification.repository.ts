import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';

import type { OrganisationVerificationEntity } from './verification.entity';

import { OrganisationVerificationRepository } from './verification.repository';

@Injectable()
export class PrismaOrganisationVerificationRepository extends OrganisationVerificationRepository {
  constructor(private readonly database: DatabaseService) {
    super();
  }

  private map(record: any): OrganisationVerificationEntity {
    return {
      id: record.id,

      organisationId: record.organisationId,

      status: record.status,

      notes: record.notes,

      submittedAt: record.submittedAt,

      reviewedAt: record.reviewedAt,
    };
  }

  async save(
    verification: OrganisationVerificationEntity,
  ): Promise<OrganisationVerificationEntity> {
    const record = await this.database.organisationVerification.create({
      data: {
        id: verification.id,

        organisationId: verification.organisationId,

        status: verification.status,

        ...(verification.notes !== undefined ? { notes: verification.notes } : {}),
      },
    });

    return this.map(record);
  }

  async findByOrganisation(
    organisationId: string,
  ): Promise<OrganisationVerificationEntity | undefined> {
    const record = await this.database.organisationVerification.findUnique({
      where: {
        organisationId,
      },
    });

    return record ? this.map(record) : undefined;
  }

  async updateStatus(
    organisationId: string,
    status: string,
  ): Promise<OrganisationVerificationEntity> {
    const record = await this.database.organisationVerification.update({
      where: {
        organisationId,
      },

      data: {
        status,

        reviewedAt: new Date(),
      },
    });

    return this.map(record);
  }
}
