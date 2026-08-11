import type { BusinessEntity } from './business.entity';

export abstract class BusinessRepository {
  abstract save(business: BusinessEntity): Promise<BusinessEntity>;

  abstract findById(id: string): Promise<BusinessEntity | undefined>;

  abstract findByOwner(ownerId: string): Promise<BusinessEntity | undefined>;

  abstract update(
    id: string,
    data: {
      name?: string;
      description?: string;
      category?: string;
    },
  ): Promise<BusinessEntity>;

  abstract remove(id: string): Promise<void>;

  abstract findByCommunity(communityId: string): Promise<BusinessEntity[]>;

  abstract search(query: string): Promise<BusinessEntity[]>;
}
