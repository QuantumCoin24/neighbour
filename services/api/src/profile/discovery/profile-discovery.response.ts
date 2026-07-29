export interface DiscoverableProfileResponse {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  localArea: string | null;
  completionScore: number;
}
