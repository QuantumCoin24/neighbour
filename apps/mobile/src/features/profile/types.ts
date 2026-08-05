import type {
  CommunityMembership,
  MarketplaceBusiness,
  PrivateProfile,
  TrustIntelligence,
  TrustProfile,
} from '@neighbour/api-client';

export type ProfileSection = 'overview' | 'communities' | 'business' | 'trust' | 'settings';

export interface ProfileHubData {
  profile: PrivateProfile | null;
  memberships: CommunityMembership[];
  business: MarketplaceBusiness | null;
  trustProfile: TrustProfile | null;
  trustIntelligence: TrustIntelligence | null;
}
