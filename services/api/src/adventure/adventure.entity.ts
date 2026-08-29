import type {
  AdventureCategory,
  AdventureScope,
  AdventureStageType,
  LocationVisibility,
} from '../generated/prisma/client.js';

export interface AdventureStageEntity {
  id: string;
  adventureId: string;
  position: number;
  type: AdventureStageType;
  title: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdventureEntity {
  id: string;
  creatorId: string;
  communityId: string | null;
  trailId: string | null;
  scope: AdventureScope;
  category: AdventureCategory;
  title: string;
  description: string;
  visibility: LocationVisibility;
  estimatedMinutes: number | null;
  startsAt: Date | null;
  expiresAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  stages: AdventureStageEntity[];
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
  trail?: {
    id: string;
    creatorId: string;
    communityId: string | null;
    title: string;
    scope: string;
    visibility: LocationVisibility;
  } | null;
}
