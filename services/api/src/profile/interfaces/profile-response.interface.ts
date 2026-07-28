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
}
