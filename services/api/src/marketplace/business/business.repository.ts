import type { BusinessEntity } from './business.entity';

export abstract class BusinessRepository {
  abstract save(business: BusinessEntity): Promise<BusinessEntity>;

  abstract findById(id: string): Promise<BusinessEntity | undefined>;

  abstract findByCommunity(communityId: string): Promise<BusinessEntity[]>;

  abstract search(query: string): Promise<BusinessEntity[]>;
}
