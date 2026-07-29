import { Injectable } from '@nestjs/common';

import type { MarketplaceServiceEntity } from './service.entity';

@Injectable()
export class MarketplaceServiceService {
  private services: MarketplaceServiceEntity[] = [];

  create(service: MarketplaceServiceEntity): MarketplaceServiceEntity {
    this.services.push(service);

    return service;
  }

  findByBusiness(businessId: string): MarketplaceServiceEntity[] {
    return this.services.filter((service) => service.businessId === businessId);
  }
}
