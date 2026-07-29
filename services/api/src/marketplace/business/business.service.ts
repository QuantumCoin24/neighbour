import { Injectable } from '@nestjs/common';

import type { BusinessEntity } from './business.entity';

import { BusinessRepository } from './business.repository';

@Injectable()
export class BusinessService {
  constructor(private readonly repository: BusinessRepository) {}

  create(business: BusinessEntity): Promise<BusinessEntity> {
    return this.repository.save(business);
  }

  findCommunityBusinesses(communityId: string): Promise<BusinessEntity[]> {
    return this.repository.findByCommunity(communityId);
  }

  search(query: string): Promise<BusinessEntity[]> {
    return this.repository.search(query);
  }
}
