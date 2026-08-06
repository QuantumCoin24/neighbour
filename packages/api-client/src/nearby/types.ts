export type NearbyResultType = 'COMMUNITY' | 'BUSINESS' | 'EVENT' | 'MARKETPLACE_LISTING';

export type NearbySortOption = 'RELEVANCE' | 'DISTANCE' | 'NEWEST';

export interface NearbyQuery {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  types?: NearbyResultType[];
  sort?: NearbySortOption;
  limit?: number;
  verifiedOnly?: boolean;
  eventsOnlyUpcoming?: boolean;
}

export interface NearbyResult {
  id: string;
  type: NearbyResultType;
  title: string;
  description: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number;
  distanceMetres: number;
  relevanceScore: number;
  verified: boolean;
  communityId: string | null;
  ownerId: string | null;
  category: string | null;
  postcode: string | null;
  imageUrl: string | null;
  pricePence: number | null;
  isFree: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface NearbyResponse {
  origin: {
    latitude: number;
    longitude: number;
  };
  radiusKm: number;
  sort: NearbySortOption;
  generatedAt: string;
  summary: {
    total: number;
    communities: number;
    businesses: number;
    events: number;
    marketplaceListings: number;
  };
  results: NearbyResult[];
}

export interface NearbyRadiusPreset {
  label: string;
  radiusKm: number;
}
