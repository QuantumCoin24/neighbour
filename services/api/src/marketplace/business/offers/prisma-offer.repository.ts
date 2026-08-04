import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../../database/database.service';

import type { OfferEntity } from './offer.entity';

import { OfferRepository } from './offer.repository';

@Injectable()
export class PrismaOfferRepository extends OfferRepository {
  constructor(private readonly database: DatabaseService) {
    super();
  }

  private map(offer: any): OfferEntity {
    return {
      id: offer.id,

      businessId: offer.businessId,

      title: offer.title,

      description: offer.description,

      active: offer.active,

      startsAt: offer.startsAt,

      endsAt: offer.endsAt,

      createdAt: offer.createdAt,
    };
  }

  async save(offer: OfferEntity): Promise<OfferEntity> {
    const record = await this.database.offer.create({
      data: {
        id: offer.id,

        businessId: offer.businessId,

        title: offer.title,

        description: offer.description,

        active: offer.active,

        startsAt: offer.startsAt,

        endsAt: offer.endsAt,
      },
    });

    return this.map(record);
  }

  async findById(id: string): Promise<OfferEntity | undefined> {
    const record = await this.database.offer.findUnique({
      where: {
        id,
      },
    });

    return record ? this.map(record) : undefined;
  }

  async findByBusiness(businessId: string): Promise<OfferEntity[]> {
    const records = await this.database.offer.findMany({
      where: {
        businessId,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

    return records.map((record) => this.map(record));
  }

  async findActive(): Promise<OfferEntity[]> {
    const records = await this.database.offer.findMany({
      where: {
        active: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

    return records.map((record) => this.map(record));
  }
}
