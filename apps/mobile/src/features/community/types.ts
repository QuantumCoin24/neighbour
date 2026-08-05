import type { Community, CommunityMembership } from '@neighbour/api-client';

export type CommunityDetailSection = 'overview' | 'feed' | 'events' | 'businesses' | 'about';

export interface CommunityDirectoryItem {
  community: Community;
  membership: CommunityMembership | null;
}

export interface CommunityDirectoryState {
  publicCommunities: Community[];
  memberships: CommunityMembership[];
  items: CommunityDirectoryItem[];
  loading: boolean;
  refreshing: boolean;
  joiningSlug: string | null;
  error: string | null;
}
