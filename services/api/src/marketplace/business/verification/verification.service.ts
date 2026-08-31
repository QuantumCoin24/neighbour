import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DatabaseService } from '../../../database/database.service';
import { BusinessVerificationStatus } from '../../../generated/prisma/client.js';

import type {
  VerificationEntity,
  VerificationQueueEntity,
} from './verification.entity';
import { VerificationRepository } from './verification.repository';

@Injectable()
export class VerificationService {
  constructor(
    private readonly repository: VerificationRepository,
    private readonly database: DatabaseService,
  ) {}

  async submit(
    userId: string,
    data: {
      businessId: string;
      notes?: string;
    },
  ): Promise<VerificationEntity> {
    const business = await this.database.business.findUnique({
      where: {
        id: data.businessId,
      },
      select: {
        id: true,
        ownerId: true,
      },
    });

    if (!business) {
      throw new NotFoundException('Business not found.');
    }

    if (business.ownerId !== userId) {
      throw new ForbiddenException('You do not have permission to verify this business.');
    }

    const existing = await this.repository.findByBusiness(data.businessId);

    if (existing?.status === BusinessVerificationStatus.PENDING) {
      return existing;
    }

    if (existing?.status === BusinessVerificationStatus.APPROVED) {
      return existing;
    }

    const notes = data.notes?.trim() || null;
    const now = new Date();

    await this.database.$transaction(async (tx) => {
      if (existing) {
        await tx.businessVerification.update({
          where: {
            businessId: data.businessId,
          },
          data: {
            status: BusinessVerificationStatus.PENDING,
            notes,
            submittedAt: now,
            reviewedAt: null,
            reviewerId: null,
          },
        });
      } else {
        await tx.businessVerification.create({
          data: {
            id: crypto.randomUUID(),
            businessId: data.businessId,
            status: BusinessVerificationStatus.PENDING,
            notes,
            submittedAt: now,
            reviewedAt: null,
            reviewerId: null,
          },
        });
      }

      await tx.business.update({
        where: {
          id: data.businessId,
        },
        data: {
          verified: false,
        },
      });
    });

    const verification = await this.repository.findByBusiness(data.businessId);

    if (!verification) {
      throw new NotFoundException('Business verification could not be loaded after submission.');
    }

    return verification;
  }

  async list(status?: string): Promise<VerificationQueueEntity[]> {
    if (
      status !== undefined &&
      status !== BusinessVerificationStatus.PENDING &&
      status !== BusinessVerificationStatus.APPROVED &&
      status !== BusinessVerificationStatus.REJECTED
    ) {
      throw new BadRequestException(
        'Verification status must be PENDING, APPROVED or REJECTED.',
      );
    }

    return this.repository.findMany(status);
  }

  async review(
    reviewerId: string,
    businessId: string,
    data: {
      status: 'APPROVED' | 'REJECTED';
      notes?: string;
    },
  ): Promise<VerificationEntity> {
    if (
      data.status !== BusinessVerificationStatus.APPROVED &&
      data.status !== BusinessVerificationStatus.REJECTED
    ) {
      throw new BadRequestException('Verification status must be APPROVED or REJECTED.');
    }

    const verification = await this.repository.findByBusiness(businessId);

    if (!verification) {
      throw new NotFoundException('Business verification not found.');
    }

    if (verification.status !== BusinessVerificationStatus.PENDING) {
      throw new ConflictException('Only pending business verifications can be reviewed.');
    }

    const notes = data.notes?.trim() || null;

    if (data.status === BusinessVerificationStatus.REJECTED && !notes) {
      throw new BadRequestException('A rejection reason is required.');
    }

    const now = new Date();

    await this.database.$transaction(async (tx) => {
      await tx.businessVerification.update({
        where: {
          businessId,
        },
        data: {
          status: data.status,
          notes,
          reviewedAt: now,
          reviewerId,
        },
      });

      await tx.business.update({
        where: {
          id: businessId,
        },
        data: {
          verified: data.status === BusinessVerificationStatus.APPROVED,
        },
      });
    });

    const reviewed = await this.repository.findByBusiness(businessId);

    if (!reviewed) {
      throw new NotFoundException('Business verification could not be loaded after review.');
    }

    return reviewed;
  }

  async findByBusiness(businessId: string): Promise<VerificationEntity | undefined> {
    return this.repository.findByBusiness(businessId);
  }
}
