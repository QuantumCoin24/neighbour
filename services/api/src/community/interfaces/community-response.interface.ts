import type {
  CommunityCategory,
  CommunityJoinPolicy,
  CommunityVisibility,
  LocationVisibility,
  MembershipRole,
  MembershipStatus,
} from '../../generated/prisma/client.js';

export interface CommunitySummary {
  id: string;
  name: string;
  slug: string;
  handle: string;
  shortDescription: string | null;
  description: string | null;
  category: CommunityCategory;
  tags: string[];
  welcomeMessage: string | null;
  rules: string[];
  logoUrl: string | null;
  bannerUrl: string | null;
  accentColour: string | null;
  visibility: CommunityVisibility;
  joinPolicy: CommunityJoinPolicy;
  approvalRequired: boolean;
  allowMemberPosts: boolean;
  allowBusinesses: boolean;
  allowMarketplace: boolean;
  allowEvents: boolean;
  discoverable: boolean;
  latitude: number | null;
  longitude: number | null;
  locationAccuracyM: number | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postcode: string | null;
  locationVisibility: LocationVisibility;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunityMembershipResponse {
  id: string;
  role: MembershipRole;
  status: MembershipStatus;
  joinedAt: Date;
  updatedAt: Date;
  community: CommunitySummary;
}
