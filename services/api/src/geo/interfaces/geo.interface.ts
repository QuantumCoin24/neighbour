export type GeoEntityType = 'NEIGHBOURHOOD' | 'COMMUNITY' | 'EVENT' | 'BUSINESS';

export type GeoLocationVisibility = 'PUBLIC' | 'COMMUNITY' | 'PRIVATE';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface GeoBounds {
  north: number;
  south: number;
  east: number;
  west: number;
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
