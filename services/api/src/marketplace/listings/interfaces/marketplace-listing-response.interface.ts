import type {
  MarketplaceListingCategory,
  MarketplaceListingCondition,
  MarketplaceListingStatus,
} from '../../../generated/prisma/client';

export interface MarketplaceListingMediaResponse {
  id: string;
  position: number;
  altText: string | null;
  asset: {
    id: string;
    url: string | null;
    fileName: string;
    mimeType: string;
    width: number | null;
    height: number | null;
  };
}

export interface MarketplaceListingResponse {
  id: string;
  title: string;
  description: string;
  category: MarketplaceListingCategory;
  condition: MarketplaceListingCondition;
  status: MarketplaceListingStatus;
  pricePence: number | null;
  isFree: boolean;
  acceptsOffers: boolean;
  collectionAvailable: boolean;
  deliveryAvailable: boolean;
  postageAvailable: boolean;
  localArea: string | null;
  postcodeDistrict: string | null;
  latitude: number | null;
  longitude: number | null;
  viewCount: number;
  seller: {
    id: string;
    displayName: string;
    username: string | null;
    avatarUrl: string | null;
    localArea: string | null;
  };
  community: {
    id: string;
    name: string;
    slug: string;
  } | null;
  media: MarketplaceListingMediaResponse[];
  saved: boolean;
  savedCount: number;
  publishedAt: Date | null;
  reservedAt: Date | null;
  soldAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketplaceListingPageResponse {
  items: MarketplaceListingResponse[];
  nextCursor: string | null;
}
