export type MarketplaceListingStatus = 'DRAFT' | 'PUBLISHED' | 'RESERVED' | 'SOLD' | 'ARCHIVED';

export type MarketplaceListingCondition =
  'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'POOR' | 'NOT_APPLICABLE';

export type MarketplaceListingCategory =
  | 'ELECTRONICS'
  | 'HOME_GARDEN'
  | 'FURNITURE'
  | 'CLOTHING'
  | 'BABY_KIDS'
  | 'SPORTS'
  | 'HOBBIES'
  | 'COLLECTABLES'
  | 'PETS'
  | 'VEHICLE_PARTS'
  | 'PROPERTY'
  | 'JOBS'
  | 'SERVICES'
  | 'TICKETS'
  | 'FREE_ITEMS'
  | 'WANTED'
  | 'OTHER';

export interface MarketplaceListingMedia {
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

export interface MarketplaceListing {
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
  media: MarketplaceListingMedia[];
  saved: boolean;
  savedCount: number;
  publishedAt: string | null;
  reservedAt: string | null;
  soldAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceListingPage {
  items: MarketplaceListing[];
  nextCursor: string | null;
}

export interface CreateMarketplaceListingInput {
  title: string;
  description: string;
  category: MarketplaceListingCategory;
  condition: MarketplaceListingCondition;
  status?: MarketplaceListingStatus;
  communityId?: string;
  pricePence?: number;
  isFree?: boolean;
  acceptsOffers?: boolean;
  collectionAvailable?: boolean;
  deliveryAvailable?: boolean;
  postageAvailable?: boolean;
  localArea?: string;
  postcodeDistrict?: string;
  latitude?: number;
  longitude?: number;
  mediaIds?: string[];
}

export type UpdateMarketplaceListingInput = Partial<CreateMarketplaceListingInput>;

export interface SearchMarketplaceListingInput {
  query?: string;
  category?: MarketplaceListingCategory;
  condition?: MarketplaceListingCondition;
  communityId?: string;
  minPricePence?: number;
  maxPricePence?: number;
  freeOnly?: boolean;
  limit?: number;
  cursor?: string;
}
