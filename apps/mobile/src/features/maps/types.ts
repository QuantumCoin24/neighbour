import type { GeoEntityType, GeoPoint, NearbyGeoItem } from '@neighbour/api-client';

export type MapPresentationMode = 'map' | 'list';

export type MapLocationStatus =
  'checking' | 'fallback' | 'requesting' | 'granted' | 'denied' | 'unavailable';

export interface MapEntityFilter {
  type: GeoEntityType;
  title: string;
  symbol: string;
}

export interface MapControllerState {
  origin: GeoPoint;
  items: NearbyGeoItem[];
  filteredItems: NearbyGeoItem[];
  selectedItem: NearbyGeoItem | null;
  selectedTypes: GeoEntityType[];
  radiusKm: number;
  mode: MapPresentationMode;
  locationStatus: MapLocationStatus;
  loading: boolean;
  refreshing: boolean;
  locating: boolean;
  error: string | null;
  usingFallbackLocation: boolean;
}
