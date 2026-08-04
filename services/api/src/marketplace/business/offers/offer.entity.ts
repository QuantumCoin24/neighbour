export interface OfferEntity {
  id: string;

  businessId: string;

  title: string;

  description: string;

  active: boolean;

  startsAt: Date | null;

  endsAt: Date | null;

  createdAt: Date;
}
