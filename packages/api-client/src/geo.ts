import { apiRequest } from './client';

export type GeoEntityType = 'NEIGHBOURHOOD' | 'COMMUNITY' | 'EVENT' | 'BUSINESS';

export type GeoLocationVisibility = 'PUBLIC' | 'COMMUNITY' | 'PRIVATE';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface GeoAddress {
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postcode: string | null;
}

export interface NearbyGeoItem {
  id: string;
  type: GeoEntityType;
  title: string;
  description: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number;
  locationAccuracyM: number | null;
  visibility: GeoLocationVisibility;
  address: GeoAddress;
  metadata: Record<string, string | number | boolean | null>;
}

export interface NearbyGeoResponse {
  origin: GeoPoint;
  radiusKm: number;
  count: number;
  items: NearbyGeoItem[];
}

export interface NearbyGeoQuery extends GeoPoint {
  radiusKm?: number;
  types?: GeoEntityType[];
  limit?: number;
}

export function getNearbyGeoItems(query: NearbyGeoQuery): Promise<NearbyGeoResponse> {
  const parameters = new URLSearchParams({
    latitude: String(query.latitude),
    longitude: String(query.longitude),
  });

  if (query.radiusKm !== undefined) {
    parameters.set('radiusKm', String(query.radiusKm));
  }

  if (query.types?.length) {
    parameters.set('types', query.types.join(','));
  }

  if (query.limit !== undefined) {
    parameters.set('limit', String(query.limit));
  }

  return apiRequest<NearbyGeoResponse>(`/geo/nearby?${parameters.toString()}`);
}

export interface PostalLocation {
  resolved: boolean;
  countryCode: string;
  postalCode: string;
  country: string | null;
  city: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface ResolvePostalLocationInput {
  countryCode: string;
  postalCode: string;
}

export function resolvePostalLocation(input: ResolvePostalLocationInput): Promise<PostalLocation> {
  const parameters = new URLSearchParams({
    countryCode: input.countryCode.trim().toUpperCase(),
    postalCode: input.postalCode.trim(),
  });

  return apiRequest<PostalLocation>(`/geo/postal/resolve?${parameters.toString()}`);
}
