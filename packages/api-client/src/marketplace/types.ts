export interface MarketplaceBusiness {
  id: string;
  communityId: string;
  ownerId: string;
  name: string;
  description: string;
  category: string;
  verified: boolean;
  createdAt: string;
}

export interface MarketplaceOffer {
  id: string;
  businessId: string;
  title: string;
  description: string;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
}

export interface MarketplaceBusinessEvent {
  id: string;
  businessId: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  createdAt: string;
}

export type BusinessVerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface BusinessVerification {
  id: string;
  businessId: string;
  status: BusinessVerificationStatus;
  notes: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  reviewerId: string | null;
}

export interface BusinessAnalytics {
  businessId: string;
  profileViews: number;
  offerViews: number;
  eventViews: number;
  totalReach: number;
}

export interface BusinessDashboard {
  business: MarketplaceBusiness | null;
  verification: BusinessVerification | null;
  offers: MarketplaceOffer[];
  events: MarketplaceBusinessEvent[];
}

export interface CreateMarketplaceBusinessRequest {
  communityId: string;
  name: string;
  description: string;
  category: string;
}

export interface CreateMarketplaceOfferRequest {
  title: string;
  description: string;
  active?: boolean;
  startsAt?: string;
  endsAt?: string;
}

export interface CreateMarketplaceBusinessEventRequest {
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
}
