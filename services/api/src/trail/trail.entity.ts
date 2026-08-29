import type { LocationVisibility, TrailCategory, TrailScope } from '../generated/prisma/client.js';

export interface TrailCheckpointEntity {
  id: string;
  trailId: string;
  mapDiscoveryId: string | null;
  position: number;
  title: string | null;
  instruction: string | null;
  latitude: number;
  longitude: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrailEntity {
  id: string;
  creatorId: string;
  communityId: string | null;
  scope: TrailScope;
  category: TrailCategory;
  title: string;
  description: string;
  visibility: LocationVisibility;
  distanceM: number | null;
  estimatedMinutes: number | null;
  startsAt: Date | null;
  expiresAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  checkpoints: TrailCheckpointEntity[];
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
