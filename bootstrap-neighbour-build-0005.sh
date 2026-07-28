#!/usr/bin/env bash

set -euo pipefail

echo "Building Neighbour™ Build 0005 — Community foundation..."

if [[ ! -f "pnpm-workspace.yaml" ]]; then
  echo "Error: run this script from the Neighbour repository root."
  exit 1
fi

echo "Creating community module directories..."

mkdir -p services/api/src/community/dto
mkdir -p services/api/src/community/interfaces
mkdir -p services/api/src/community/utils
mkdir -p services/api/test
mkdir -p docs/architecture

cat > services/api/src/community/dto/create-community.dto.ts <<'EOF'
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

import { CommunityVisibility } from '../../generated/prisma/enums.js';

export class CreateCommunityDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(3, 100)
  name!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsEnum(CommunityVisibility)
  visibility: CommunityVisibility = CommunityVisibility.PUBLIC;
}
EOF

cat > services/api/src/community/interfaces/community-response.interface.ts <<'EOF'
import type {
  CommunityVisibility,
  MembershipRole,
  MembershipStatus,
} from '../../generated/prisma/enums.js';

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
EOF

cat > services/api/src/community/utils/community-slug.util.ts <<'EOF'
export function createCommunitySlug(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  return slug || 'community';
}
EOF

cat > services/api/src/community/community.service.ts <<'EOF'
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
} from '../generated/prisma/enums.js';
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

  async create(
    userId: string,
    dto: CreateCommunityDto,
  ): Promise<CommunitySummary> {
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

    return communities.map((community) =>
      this.toCommunitySummary(community),
    );
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

  async join(
    userId: string,
    slug: string,
  ): Promise<CommunityMembershipResponse> {
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

    const existingMembership =
      await this.database.membership.findUnique({
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
      throw new ConflictException(
        'You are already connected to this community.',
      );
    }

    if (existingMembership?.status === MembershipStatus.BLOCKED) {
      throw new ForbiddenException(
        'You cannot join this community.',
      );
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
EOF

cat > services/api/src/community/community.controller.ts <<'EOF'
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CommunityService } from './community.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import type {
  CommunityMembershipResponse,
  CommunitySummary,
} from './interfaces/community-response.interface';

@Controller('communities')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateCommunityDto,
  ): Promise<CommunitySummary> {
    return this.communityService.create(user.id, dto);
  }

  @Get('mine')
  findMine(
    @CurrentUser() user: AuthUser,
  ): Promise<CommunityMembershipResponse[]> {
    return this.communityService.findMine(user.id);
  }

  @Public()
  @Get()
  findPublic(): Promise<CommunitySummary[]> {
    return this.communityService.findPublic();
  }

  @Post(':slug/join')
  join(
    @CurrentUser() user: AuthUser,
    @Param('slug') slug: string,
  ): Promise<CommunityMembershipResponse> {
    return this.communityService.join(user.id, slug);
  }

  @Public()
  @Get(':slug')
  findPublicBySlug(
    @Param('slug') slug: string,
  ): Promise<CommunitySummary> {
    return this.communityService.findPublicBySlug(slug);
  }
}
EOF

cat > services/api/src/community/community.module.ts <<'EOF'
import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';

@Module({
  imports: [DatabaseModule],
  controllers: [CommunityController],
  providers: [CommunityService],
  exports: [CommunityService],
})
export class CommunityModule {}
EOF

cat > services/api/test/community.dto.test.ts <<'EOF'
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateCommunityDto } from '../src/community/dto/create-community.dto';
import { CommunityVisibility } from '../src/generated/prisma/enums.js';

describe('CreateCommunityDto', () => {
  it('normalises a valid community request', async () => {
    const dto = plainToInstance(CreateCommunityDto, {
      name: '  Blackley Neighbours  ',
      description: '  A community for local residents.  ',
      visibility: CommunityVisibility.PUBLIC,
    });

    const errors = await validate(dto);

    assert.equal(errors.length, 0);
    assert.equal(dto.name, 'Blackley Neighbours');
    assert.equal(
      dto.description,
      'A community for local residents.',
    );
    assert.equal(dto.visibility, CommunityVisibility.PUBLIC);
  });

  it('rejects a community name that is too short', async () => {
    const dto = plainToInstance(CreateCommunityDto, {
      name: 'AB',
    });

    const errors = await validate(dto);

    assert.ok(errors.some((error) => error.property === 'name'));
  });
});
EOF

cat > services/api/test/community-slug.test.ts <<'EOF'
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createCommunitySlug } from '../src/community/utils/community-slug.util';

describe('createCommunitySlug', () => {
  it('creates a URL-safe community slug', () => {
    assert.equal(
      createCommunitySlug('Blackley & Charlestown Residents'),
      'blackley-and-charlestown-residents',
    );
  });

  it('removes punctuation and repeated separators', () => {
    assert.equal(
      createCommunitySlug('  Neighbour™ -- Community!!!  '),
      'neighbour-community',
    );
  });

  it('provides a fallback slug', () => {
    assert.equal(createCommunitySlug('***'), 'community');
  });
});
EOF

cat > docs/architecture/0005-community-foundation.md <<'EOF'
# Build 0005 — Community Foundation

## Purpose

Build 0005 introduces the first core Neighbour™ application domain:
communities and community membership.

## Capabilities

- Authenticated users can create communities.
- A community creator becomes its owner automatically.
- Public communities can be listed without authentication.
- Public communities can be viewed by slug.
- Authenticated users can list their own memberships.
- Authenticated users can join public communities.
- Duplicate active memberships are rejected.
- Blocked users cannot rejoin.
- Former members may reactivate a membership.
- Community names are converted into unique URL-safe slugs.

## API routes

| Method | Route | Access |
| --- | --- | --- |
| POST | `/api/v1/communities` | Authenticated |
| GET | `/api/v1/communities` | Public |
| GET | `/api/v1/communities/mine` | Authenticated |
| GET | `/api/v1/communities/:slug` | Public |
| POST | `/api/v1/communities/:slug/join` | Authenticated |

## Data model

Build 0005 uses the existing Prisma models:

- `Community`
- `Membership`
- `User`

Each user/community relationship remains protected by the compound unique
constraint on `userId` and `communityId`.

## Ownership

Community creation performs two connected actions:

1. Creates the community.
2. Creates an active owner membership for the authenticated creator.

The nested Prisma write ensures both records are created atomically.

## Validation

Community names must contain between 3 and 100 characters.

Descriptions are optional and limited to 1,000 characters.

Visibility must use a supported `CommunityVisibility` enum value.

## Testing

Build 0005 adds automated tests for:

- Community DTO normalisation.
- Invalid community names.
- URL-safe slug generation.
- Ampersand handling.
- Punctuation removal.
- Fallback slug generation.
EOF

python3 - <<'PY'
from pathlib import Path

path = Path("services/api/src/app.module.ts")
text = path.read_text()

community_import = "import { CommunityModule } from './community/community.module';\n"

if community_import not in text:
    anchor = "import { environment } from './config/environment';\n"
    text = text.replace(anchor, community_import + anchor)

if "    CommunityModule,\n" not in text:
    text = text.replace(
        "    AuthModule,\n",
        "    AuthModule,\n    CommunityModule,\n",
    )

path.write_text(text)
PY

echo "Formatting and validating Build 0005..."

pnpm format
pnpm check

echo
echo "Neighbour™ Build 0005 completed successfully."
echo "Community foundation is ready."