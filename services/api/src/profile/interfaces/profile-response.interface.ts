export interface PublicProfileResponse {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  localArea: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PrivateProfileResponse extends PublicProfileResponse {
  showLocalArea: boolean;

  /*
   * Structured postal identity is private account data.
   * PublicProfileResponse deliberately does not expose these fields.
   */
  postalCode: string | null;
  countryCode: string | null;
  city: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
}
