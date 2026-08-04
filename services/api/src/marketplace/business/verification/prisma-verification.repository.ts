import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../../database/database.service';

import type { VerificationEntity } from './verification.entity';

import { VerificationRepository } from './verification.repository';

@Injectable()
export class PrismaVerificationRepository extends VerificationRepository {
  constructor(private readonly database: DatabaseService) {
    super();
  }

  private map(verification: any): VerificationEntity {
    return {
      id: verification.id,

      businessId: verification.businessId,

      status: verification.status,

      notes: verification.notes,

      submittedAt: verification.submittedAt,

      reviewedAt: verification.reviewedAt,

      reviewerId: verification.reviewerId,
    };
  }

  async save(verification: VerificationEntity): Promise<VerificationEntity> {
    const record = await this.database.businessVerification.create({
      data: {
        id: verification.id,

        businessId: verification.businessId,

        status: verification.status as any,

        notes: verification.notes ?? null,

        reviewedAt: verification.reviewedAt ?? null,

        reviewerId: verification.reviewerId ?? null,
      },
    });

    return this.map(record);
  }

  async findByBusiness(businessId: string): Promise<VerificationEntity | undefined> {
    const record = await this.database.businessVerification.findUnique({
      where: {
        businessId,
      },
    });

    return record ? this.map(record) : undefined;
  }
}
