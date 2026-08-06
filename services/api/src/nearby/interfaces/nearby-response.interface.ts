import type { NearbyResultType, NearbySortOption } from '../dto/nearby-query.dto';

export interface NearbyCoordinates {
  latitude: number;
  longitude: number;
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

export interface NearbySummary {
  total: number;
  communities: number;
  businesses: number;
  events: number;
  marketplaceListings: number;
}

export interface NearbyResponse {
  origin: NearbyCoordinates;
  radiusKm: number;
  sort: NearbySortOption;
  generatedAt: string;
  summary: NearbySummary;
  results: NearbyResult[];
}

export interface NearbyHealthResponse {
  module: 'NearbyOS';
  status: 'operational';
  version: '1.0.0';
  capabilities: readonly [
    'RADIUS_SEARCH',
    'DISTANCE_CALCULATION',
    'MULTI_DOMAIN_RESULTS',
    'RELEVANCE_RANKING',
  ];
}
