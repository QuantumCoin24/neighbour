export interface ProfileEntity {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string;
  localArea: string | null;
  showLocalArea: boolean;
  neighbourhoodId?: string;
  createdAt: Date;
  updatedAt: Date;
}
