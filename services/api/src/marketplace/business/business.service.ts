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


  findById(id: string): Promise<BusinessEntity | undefined> {
    return this.repository.findById(id);
  }


  findByOwner(ownerId: string): Promise<BusinessEntity | undefined> {

    return this.repository.findByOwner(
      ownerId,
    );

  }



  search(query: string): Promise<BusinessEntity[]> {
    return this.repository.search(query);
  }
}
