import type {
  LocationVisibility,
  MapDiscoveryCategory,
  MapDiscoveryScope,
  MapDiscoveryType,
} from '../generated/prisma/client.js';

export interface MapDiscoveryEntity {
  id: string;
  creatorId: string;
  communityId: string | null;
  scope: MapDiscoveryScope;
  type: MapDiscoveryType;
  category: MapDiscoveryCategory;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  locationAccuracyM: number | null;
  visibility: LocationVisibility;
  startsAt: Date | null;
  expiresAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  creator?: {
    id: string;
    displayName: string;
    username?: string | null;
  };
  community?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}
