import { Injectable } from '@nestjs/common';

import { randomUUID } from 'crypto';

import type { BusinessEventEntity } from './event.entity';

import { BusinessEventRepository } from './event.repository';

@Injectable()
export class BusinessEventService {
  constructor(private readonly repository: BusinessEventRepository) {}

  async create(input: {
    businessId: string;
    title: string;
    description: string;
    startsAt: Date;
    endsAt: Date;
  }): Promise<BusinessEventEntity> {
    return this.repository.save({
      id: randomUUID(),

      businessId: input.businessId,

      title: input.title,

      description: input.description,

      startsAt: input.startsAt,

      endsAt: input.endsAt,

      createdAt: new Date(),
    });
  }

  async findByBusiness(businessId: string): Promise<BusinessEventEntity[]> {
    return this.repository.findByBusiness(businessId);
  }

  async findById(id: string): Promise<BusinessEventEntity | undefined> {
    return this.repository.findById(id);
  }
}
