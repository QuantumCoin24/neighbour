import type {
  MarketplaceOfferStatus,
  MarketplaceTransactionStatus,
} from '../../../generated/prisma/client';

export interface MarketplaceTransactionUserResponse {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
}

export interface MarketplaceTransactionListingResponse {
  id: string;
  title: string;
  pricePence: number | null;
  isFree: boolean;
  status: string;
  imageUrl: string | null;
}

export interface MarketplaceOfferHistoryResponse {
  id: string;
  actorId: string;
  fromStatus: MarketplaceOfferStatus | null;
  toStatus: MarketplaceOfferStatus;
  amountPence: number | null;
  note: string | null;
  createdAt: Date;
}

export interface MarketplaceTransactionResponse {
  id: string;
  listingId: string;
  acceptedOfferId: string;
  buyerId: string;
  sellerId: string;
  conversationId: string | null;
  status: MarketplaceTransactionStatus;
  agreedPricePence: number;
  reservedAt: Date;
  expiresAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketplaceOfferResponse {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  parentOfferId: string | null;
  status: MarketplaceOfferStatus;
  amountPence: number;
  message: string | null;
  expiresAt: Date | null;
  acceptedAt: Date | null;
  declinedAt: Date | null;
  withdrawnAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  buyer: MarketplaceTransactionUserResponse;
  seller: MarketplaceTransactionUserResponse;
  listing: MarketplaceTransactionListingResponse;
  history: MarketplaceOfferHistoryResponse[];
  transaction: MarketplaceTransactionResponse | null;
}

export interface MarketplaceOfferListResponse {
  items: MarketplaceOfferResponse[];
}
