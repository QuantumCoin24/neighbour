import type {
  CommunityVisibility,
  MembershipRole,
  MembershipStatus,
} from '../../generated/prisma/client.js';

export interface CommunitySummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: CommunityVisibility;
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
