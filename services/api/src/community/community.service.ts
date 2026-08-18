import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import {
  CommunityJoinPolicy,
  CommunityVisibility,
  MembershipRole,
  MembershipStatus,
  Prisma,
} from '../generated/prisma/client.js';
import type { CreateCommunityDto } from './dto/create-community.dto';
import type { SearchCommunityDto } from './dto/search-community.dto';
import type {
  CommunityMembershipResponse,
  CommunitySummary,
} from './interfaces/community-response.interface';
import { createCommunitySlug } from './utils/community-slug.util';

const communityWithCount = Prisma.validator<Prisma.CommunityDefaultArgs>()({
  include: {
    _count: {
      select: {
        memberships: {
          where: {
            status: MembershipStatus.ACTIVE,
          },
        },
      },
    },
  },
});

type CommunityWithCount = Prisma.CommunityGetPayload<typeof communityWithCount>;

@Injectable()
export class CommunityService {
  constructor(
    @Inject(DatabaseService)
    private readonly database: DatabaseService,
  ) {}

  async create(userId: string, dto: CreateCommunityDto): Promise<CommunitySummary> {
    const slug = await this.generateAvailableSlug(dto.name);

    const handle = await this.generateAvailableHandle(dto.handle ?? slug);

    const approvalRequired =
      dto.joinPolicy === CommunityJoinPolicy.APPROVAL || dto.approvalRequired;

    const community = await this.database.community.create({
      data: {
        name: dto.name,
        slug,
        handle,
        shortDescription: dto.shortDescription || null,
        description: dto.description || null,
        category: dto.category,
        tags: dto.tags,
        welcomeMessage: dto.welcomeMessage || null,
        rules: dto.rules,
        logoUrl: dto.logoUrl || null,
        bannerUrl: dto.bannerUrl || null,
        accentColour: dto.accentColour || null,
        visibility: dto.visibility,
        joinPolicy: dto.joinPolicy,
        approvalRequired,
        allowMemberPosts: dto.allowMemberPosts,
        allowBusinesses: dto.allowBusinesses,
        allowMarketplace: dto.allowMarketplace,
        allowEvents: dto.allowEvents,
        discoverable: dto.discoverable,

        ...(dto.latitude !== undefined
          ? {
              latitude: dto.latitude,
            }
          : {}),

        ...(dto.longitude !== undefined
          ? {
              longitude: dto.longitude,
            }
          : {}),

        ...(dto.locationAccuracyM !== undefined
          ? {
              locationAccuracyM: dto.locationAccuracyM,
            }
          : {}),

        addressLine1: dto.addressLine1 || null,
        addressLine2: dto.addressLine2 || null,
        city: dto.city || null,
        postcode: dto.postcode || null,
        locationVisibility: dto.locationVisibility,

        memberships: {
          create: {
            userId,
            role: MembershipRole.OWNER,
            status: MembershipStatus.ACTIVE,
          },
        },
      },

      include: communityWithCount.include,
    });

    return this.toCommunitySummary(community);
  }

  async findPublic(query: SearchCommunityDto): Promise<CommunitySummary[]> {
    const q = query.q?.trim();

    const communities = await this.database.community.findMany({
      where: {
        visibility: CommunityVisibility.PUBLIC,
        discoverable: true,

        ...(query.category
          ? {
              category: query.category,
            }
          : {}),

        ...(query.postcode
          ? {
              postcode: {
                startsWith: query.postcode,
                mode: 'insensitive',
              },
            }
          : {}),

        ...(query.city
          ? {
              city: {
                contains: query.city,
                mode: 'insensitive',
              },
            }
          : {}),

        ...(q
          ? {
              OR: [
                {
                  name: {
                    contains: q,
                    mode: 'insensitive',
                  },
                },
                {
                  handle: {
                    contains: q.replace(/^@/, '').toLowerCase(),
                    mode: 'insensitive',
                  },
                },
                {
                  description: {
                    contains: q,
                    mode: 'insensitive',
                  },
                },
                {
                  city: {
                    contains: q,
                    mode: 'insensitive',
                  },
                },
                {
                  postcode: {
                    contains: q,
                    mode: 'insensitive',
                  },
                },
                {
                  tags: {
                    has: q.toLowerCase(),
                  },
                },
              ],
            }
          : {}),
      },

      include: communityWithCount.include,

      orderBy: [
        {
          createdAt: 'desc',
        },
        {
          name: 'asc',
        },
      ],

      take: query.limit,
    });

    return communities.map((community) => this.toCommunitySummary(community));
  }

  async findPublicBySlug(slug: string): Promise<CommunitySummary> {
    const community = await this.database.community.findFirst({
      where: {
        slug,
        visibility: CommunityVisibility.PUBLIC,
      },

      include: communityWithCount.include,
    });

    if (!community) {
      throw new NotFoundException('Community not found.');
    }

    return this.toCommunitySummary(community);
  }

  async findMine(userId: string): Promise<CommunityMembershipResponse[]> {
    const memberships = await this.database.membership.findMany({
      where: {
        userId,
        status: {
          in: [MembershipStatus.ACTIVE, MembershipStatus.INVITED],
        },
      },

      include: {
        community: communityWithCount,
      },

      orderBy: {
        joinedAt: 'desc',
      },
    });

    return memberships.map((membership) => ({
      id: membership.id,
      role: membership.role,
      status: membership.status,
      joinedAt: membership.joinedAt,
      updatedAt: membership.updatedAt,
      community: this.toCommunitySummary(membership.community),
    }));
  }

  async join(userId: string, slug: string): Promise<CommunityMembershipResponse> {
    const community = await this.database.community.findFirst({
      where: {
        slug,
        visibility: CommunityVisibility.PUBLIC,
        discoverable: true,
      },

      include: communityWithCount.include,
    });

    if (!community) {
      throw new NotFoundException('Community not found.');
    }

    if (community.joinPolicy === CommunityJoinPolicy.INVITE_ONLY) {
      throw new ForbiddenException('This community can only be joined using an invitation.');
    }

    const existingMembership = await this.database.membership.findUnique({
      where: {
        userId_communityId: {
          userId,
          communityId: community.id,
        },
      },
    });

    if (
      existingMembership?.status === MembershipStatus.ACTIVE ||
      existingMembership?.status === MembershipStatus.INVITED
    ) {
      throw new ConflictException('You are already connected to this community.');
    }

    if (existingMembership?.status === MembershipStatus.BLOCKED) {
      throw new ForbiddenException('You cannot join this community.');
    }

    const requiresApproval =
      community.approvalRequired || community.joinPolicy === CommunityJoinPolicy.APPROVAL;

    const status = requiresApproval ? MembershipStatus.INVITED : MembershipStatus.ACTIVE;

    const membership = existingMembership
      ? await this.database.membership.update({
          where: {
            id: existingMembership.id,
          },

          data: {
            role: MembershipRole.MEMBER,
            status,
            joinedAt: new Date(),
          },
        })
      : await this.database.membership.create({
          data: {
            userId,
            communityId: community.id,
            role: MembershipRole.MEMBER,
            status,
          },
        });

    return {
      id: membership.id,
      role: membership.role,
      status: membership.status,
      joinedAt: membership.joinedAt,
      updatedAt: membership.updatedAt,

      community: {
        ...this.toCommunitySummary(community),

        memberCount: community._count.memberships + (status === MembershipStatus.ACTIVE ? 1 : 0),
      },
    };
  }

  async delete(
    userId: string,
    slug: string,
  ): Promise<{
    deleted: true;
    communityId: string;
  }> {
    const membership = await this.database.membership.findFirst({
      where: {
        userId,
        role: MembershipRole.OWNER,
        status: MembershipStatus.ACTIVE,
        community: {
          slug,
        },
      },
      select: {
        communityId: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Only the community owner may delete this community.');
    }

    await this.database.community.delete({
      where: {
        id: membership.communityId,
      },
    });

    return {
      deleted: true,
      communityId: membership.communityId,
    };
  }

  async leave(
    userId: string,
    slug: string,
  ): Promise<{
    left: true;
    communityId: string;
  }> {
    const membership = await this.database.membership.findFirst({
      where: {
        userId,

        community: {
          slug,
        },

        status: MembershipStatus.ACTIVE,
      },

      include: {
        community: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Active community membership not found.');
    }

    if (membership.role === MembershipRole.OWNER) {
      throw new ForbiddenException('The community owner must transfer ownership before leaving.');
    }

    await this.database.membership.update({
      where: {
        id: membership.id,
      },

      data: {
        status: MembershipStatus.LEFT,
      },
    });

    return {
      left: true,
      communityId: membership.community.id,
    };
  }

  private async generateAvailableSlug(name: string): Promise<string> {
    const baseSlug = createCommunitySlug(name);

    let candidate = baseSlug;
    let suffix = 2;

    while (
      await this.database.community.findUnique({
        where: {
          slug: candidate,
        },

        select: {
          id: true,
        },
      })
    ) {
      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  private async generateAvailableHandle(requested: string): Promise<string> {
    const baseHandle =
      createCommunitySlug(requested).replace(/-/g, '.').slice(0, 40) || 'community';

    let candidate = baseHandle;
    let suffix = 2;

    while (
      await this.database.community.findUnique({
        where: {
          handle: candidate,
        },

        select: {
          id: true,
        },
      })
    ) {
      const suffixText = `.${suffix}`;

      candidate = `${baseHandle.slice(0, 40 - suffixText.length)}${suffixText}`;

      suffix += 1;
    }

    return candidate;
  }

  private toCommunitySummary(community: CommunityWithCount): CommunitySummary {
    return {
      id: community.id,
      name: community.name,
      slug: community.slug,
      handle: community.handle,
      shortDescription: community.shortDescription,
      description: community.description,
      category: community.category,
      tags: community.tags,
      welcomeMessage: community.welcomeMessage,
      rules: community.rules,
      logoUrl: community.logoUrl,
      bannerUrl: community.bannerUrl,
      accentColour: community.accentColour,
      visibility: community.visibility,
      joinPolicy: community.joinPolicy,
      approvalRequired: community.approvalRequired,
      allowMemberPosts: community.allowMemberPosts,
      allowBusinesses: community.allowBusinesses,
      allowMarketplace: community.allowMarketplace,
      allowEvents: community.allowEvents,
      discoverable: community.discoverable,

      latitude: community.latitude === null ? null : Number(community.latitude),

      longitude: community.longitude === null ? null : Number(community.longitude),

      locationAccuracyM: community.locationAccuracyM,
      addressLine1: community.addressLine1,
      addressLine2: community.addressLine2,
      city: community.city,
      postcode: community.postcode,
      locationVisibility: community.locationVisibility,
      memberCount: community._count.memberships,
      createdAt: community.createdAt,
      updatedAt: community.updatedAt,
    };
  }
}
