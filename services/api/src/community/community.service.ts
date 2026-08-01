import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  CommunityVisibility,
  MembershipRole,
  MembershipStatus,
} from '../generated/prisma/client.js';
import { DatabaseService } from '../database/database.service';
import type { CreateCommunityDto } from './dto/create-community.dto';
import type {
  CommunityMembershipResponse,
  CommunitySummary,
} from './interfaces/community-response.interface';
import { createCommunitySlug } from './utils/community-slug.util';

@Injectable()
export class CommunityService {
  constructor(
    @Inject(DatabaseService)
    private readonly database: DatabaseService,
  ) {}

  async create(userId: string, dto: CreateCommunityDto): Promise<CommunitySummary> {
    const slug = await this.generateAvailableSlug(dto.name);

    const community = await this.database.community.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description || null,
        visibility: dto.visibility,
        memberships: {
          create: {
            userId,
            role: MembershipRole.OWNER,
            status: MembershipStatus.ACTIVE,
          },
        },
      },
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

    return this.toCommunitySummary(community);
  }

  async findPublic(): Promise<CommunitySummary[]> {
    const communities = await this.database.community.findMany({
      where: {
        visibility: CommunityVisibility.PUBLIC,
      },
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
      orderBy: [{ createdAt: 'desc' }, { name: 'asc' }],
    });

    return communities.map((community) => this.toCommunitySummary(community));
  }

  async findPublicBySlug(slug: string): Promise<CommunitySummary> {
    const community = await this.database.community.findFirst({
      where: {
        slug,
        visibility: CommunityVisibility.PUBLIC,
      },
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
        community: {
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
        },
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
      },
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

    if (!community) {
      throw new NotFoundException('Community not found.');
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

    const membership = existingMembership
      ? await this.database.membership.update({
          where: {
            id: existingMembership.id,
          },
          data: {
            role: MembershipRole.MEMBER,
            status: MembershipStatus.ACTIVE,
            joinedAt: new Date(),
          },
        })
      : await this.database.membership.create({
          data: {
            userId,
            communityId: community.id,
            role: MembershipRole.MEMBER,
            status: MembershipStatus.ACTIVE,
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
        memberCount: community._count.memberships + 1,
      },
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

  private toCommunitySummary(community: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    visibility: CommunityVisibility;
    createdAt: Date;
    updatedAt: Date;
    _count: {
      memberships: number;
    };
  }): CommunitySummary {
    return {
      id: community.id,
      name: community.name,
      slug: community.slug,
      description: community.description,
      visibility: community.visibility,
      memberCount: community._count.memberships,
      createdAt: community.createdAt,
      updatedAt: community.updatedAt,
    };
  }
}
