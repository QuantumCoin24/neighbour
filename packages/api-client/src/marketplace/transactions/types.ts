export type MarketplaceOfferStatus =
  'PENDING' | 'COUNTERED' | 'ACCEPTED' | 'DECLINED' | 'WITHDRAWN' | 'EXPIRED' | 'CANCELLED';

export type MarketplaceTransactionStatus =
  'RESERVED' | 'COLLECTION_PENDING' | 'DELIVERY_PENDING' | 'COMPLETED' | 'CANCELLED';

export interface MarketplaceTransactionUser {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
}

export interface MarketplaceTransactionListing {
  id: string;
  title: string;
  pricePence: number | null;
  isFree: boolean;
  status: string;
  imageUrl: string | null;
}

export interface MarketplaceOfferHistory {
  id: string;
  actorId: string;
  fromStatus: MarketplaceOfferStatus | null;
  toStatus: MarketplaceOfferStatus;
  amountPence: number | null;
  note: string | null;
  createdAt: string;
}

export interface MarketplaceTransaction {
  id: string;
  listingId: string;
  acceptedOfferId: string | null;
  buyerId: string;
  sellerId: string;
  conversationId: string | null;
  status: MarketplaceTransactionStatus;
  agreedPricePence: number;
  reservedAt: string;
  expiresAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplacePeerOffer {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  parentOfferId: string | null;
  status: MarketplaceOfferStatus;
  amountPence: number;
  message: string | null;
  expiresAt: string | null;
  acceptedAt: string | null;
  declinedAt: string | null;
  withdrawnAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  buyer: MarketplaceTransactionUser;
  seller: MarketplaceTransactionUser;
  listing: MarketplaceTransactionListing;
  history: MarketplaceOfferHistory[];
  transaction: MarketplaceTransaction | null;
}

export interface MarketplaceOfferList {
  items: MarketplacePeerOffer[];
}

export interface CreateMarketplacePeerOfferInput {
  amountPence: number;
  message?: string;
  expiresInDays?: number;
}

export interface CounterMarketplacePeerOfferInput {
  amountPence: number;
  message?: string;
  expiresInDays?: number;
}

export interface MarketplaceOfferQuery {
  status?: MarketplaceOfferStatus;
  limit?: number;
}
