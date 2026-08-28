import type { LocationVisibility } from '../../generated/prisma/client.js';

export interface EventEntity {
  id: string;

  communityId: string;
  creatorId: string;

  title: string;
  description: string;

  startsAt: Date;
  endsAt: Date;
  latitude?: number | null;
  longitude?: number | null;
  locationAccuracyM?: number | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  postcode?: string | null;
  locationVisibility?: LocationVisibility;

  createdAt: Date;

  community?: {
    id: string;
    name: string;
  };

  creator?: {
    id: string;
    displayName: string;
  };

  attendanceCount?: number;
}
