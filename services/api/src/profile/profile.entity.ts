export interface ProfileEntity {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string;
  localArea: string | null;
  postalCode?: string | null;
  countryCode?: string | null;
  city?: string | null;
  region?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  showLocalArea: boolean;
  neighbourhoodId?: string;
  createdAt: Date;
  updatedAt: Date;
}
