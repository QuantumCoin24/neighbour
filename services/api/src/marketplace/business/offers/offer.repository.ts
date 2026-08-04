import type { OfferEntity } from './offer.entity';

export abstract class OfferRepository {
  abstract save(offer: OfferEntity): Promise<OfferEntity>;

  abstract findById(id: string): Promise<OfferEntity | undefined>;

  abstract findByBusiness(businessId: string): Promise<OfferEntity[]>;

  abstract findActive(): Promise<OfferEntity[]>;
}
