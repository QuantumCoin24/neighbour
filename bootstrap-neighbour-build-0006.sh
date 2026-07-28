#!/usr/bin/env bash

set -euo pipefail

echo "Building Neighbour™ Build 0006 — User Profiles and Neighbour Identity..."

if [[ ! -f "pnpm-workspace.yaml" ]]; then
  echo "Error: run this script from the Neighbour repository root."
  exit 1
fi

mkdir -p services/api/src/profile/dto
mkdir -p services/api/src/profile/interfaces
mkdir -p services/api/src/profile/utils
mkdir -p services/api/test
mkdir -p docs/architecture

echo "Updating the Prisma data model..."

python3 - <<'PY'
from pathlib import Path

path = Path("services/api/prisma/schema.prisma")
text = path.read_text()

profile_relation = "  profile         UserProfile?\n"

if profile_relation not in text:
    anchor = "  memberships     Membership[]\n"
    text = text.replace(anchor, anchor + profile_relation)

profile_model = '''
model UserProfile {
  id            String   @id @default(uuid()) @db.Uuid
  userId        String   @unique @db.Uuid
  username      String   @unique
  bio           String?
  avatarUrl     String?
  localArea     String?
  showLocalArea Boolean  @default(false)
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([username])
  @@index([showLocalArea])
  @@map("user_profiles")
}
'''

if "model UserProfile {" not in text:
    user_model_end = '  @@map("users")\n}\n'
    text = text.replace(
        user_model_end,
        user_model_end + "\n" + profile_model,
    )

path.write_text(text)
PY

cat > services/api/src/profile/dto/update-profile.dto.ts <<'EOF'
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateProfileDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsOptional()
  @IsString()
  @Length(3, 30)
  @Matches(/^[a-z0-9](?:[a-z0-9._]*[a-z0-9])?$/, {
    message:
      'username may contain lowercase letters, numbers, full stops and underscores',
  })
  username?: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsUrl(
    {
      protocols: ['http', 'https'],
      require_protocol: true,
    },
    {
      message: 'avatarUrl must be a valid HTTP or HTTPS URL',
    },
  )
  @MaxLength(2048)
  avatarUrl?: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(100)
  localArea?: string;

  @IsOptional()
  @IsBoolean()
  showLocalArea?: boolean;
}
EOF

cat > services/api/src/profile/interfaces/profile-response.interface.ts <<'EOF'
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
EOF

cat > services/api/src/profile/utils/profile-username.util.ts <<'EOF'
export function normaliseUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function createUsernameCandidate(
  displayName: string,
  userId: string,
): string {
  const base = displayName
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .replace(/\.{2,}/g, '.')
    .slice(0, 21)
    .replace(/\.+$/g, '');

  const safeBase = base.length >= 3 ? base : 'neighbour';
  const suffix = userId.replace(/-/g, '').slice(0, 8);

  return `${safeBase}.${suffix}`.slice(0, 30);
}
EOF

cat > services/api/src/profile/profile.service.ts <<'EOF'
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import type { UpdateProfileDto } from './dto/update-profile.dto';
import type {
  PrivateProfileResponse,
  PublicProfileResponse,
} from './interfaces/profile-response.interface';
import {
  createUsernameCandidate,
  normaliseUsername,
} from './utils/profile-username.util';

@Injectable()
export class ProfileService {
  constructor(
    @Inject(DatabaseService)
    private readonly database: DatabaseService,
  ) {}

  async findMine(userId: string): Promise<PrivateProfileResponse> {
    const profile = await this.ensureProfile(userId);

    return this.toPrivateResponse(profile);
  }

  async updateMine(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<PrivateProfileResponse> {
    const existingProfile = await this.ensureProfile(userId);

    if (
      dto.username &&
      normaliseUsername(dto.username) !== existingProfile.username
    ) {
      await this.assertUsernameAvailable(dto.username, userId);
    }

    const profile = await this.database.userProfile.update({
      where: {
        userId,
      },
      data: {
        ...(dto.username !== undefined
          ? { username: normaliseUsername(dto.username) }
          : {}),
        ...(dto.bio !== undefined
          ? { bio: dto.bio.length > 0 ? dto.bio : null }
          : {}),
        ...(dto.avatarUrl !== undefined
          ? {
              avatarUrl:
                dto.avatarUrl.length > 0 ? dto.avatarUrl : null,
            }
          : {}),
        ...(dto.localArea !== undefined
          ? {
              localArea:
                dto.localArea.length > 0 ? dto.localArea : null,
            }
          : {}),
        ...(dto.showLocalArea !== undefined
          ? { showLocalArea: dto.showLocalArea }
          : {}),
      },
      include: {
        user: {
          select: {
            displayName: true,
          },
        },
      },
    });

    return this.toPrivateResponse(profile);
  }

  async findPublicByUsername(
    username: string,
  ): Promise<PublicProfileResponse> {
    const profile = await this.database.userProfile.findUnique({
      where: {
        username: normaliseUsername(username),
      },
      include: {
        user: {
          select: {
            displayName: true,
            status: true,
          },
        },
      },
    });

    if (!profile || profile.user.status !== 'ACTIVE') {
      throw new NotFoundException('Profile not found.');
    }

    return this.toPublicResponse(profile);
  }

  private async ensureProfile(userId: string) {
    const existingProfile = await this.database.userProfile.findUnique({
      where: {
        userId,
      },
      include: {
        user: {
          select: {
            displayName: true,
          },
        },
      },
    });

    if (existingProfile) {
      return existingProfile;
    }

    const user = await this.database.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        displayName: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const username = await this.generateAvailableUsername(
      user.displayName,
      user.id,
    );

    return this.database.userProfile.create({
      data: {
        userId,
        username,
      },
      include: {
        user: {
          select: {
            displayName: true,
          },
        },
      },
    });
  }

  private async assertUsernameAvailable(
    username: string,
    currentUserId: string,
  ): Promise<void> {
    const existingProfile =
      await this.database.userProfile.findUnique({
        where: {
          username: normaliseUsername(username),
        },
        select: {
          userId: true,
        },
      });

    if (
      existingProfile &&
      existingProfile.userId !== currentUserId
    ) {
      throw new ConflictException('Username is already in use.');
    }
  }

  private async generateAvailableUsername(
    displayName: string,
    userId: string,
  ): Promise<string> {
    const baseCandidate = createUsernameCandidate(
      displayName,
      userId,
    );

    let candidate = baseCandidate;
    let suffix = 2;

    while (
      await this.database.userProfile.findUnique({
        where: {
          username: candidate,
        },
        select: {
          id: true,
        },
      })
    ) {
      const suffixText = `.${suffix}`;
      candidate = `${baseCandidate.slice(
        0,
        30 - suffixText.length,
      )}${suffixText}`;

      suffix += 1;
    }

    return candidate;
  }

  private toPrivateResponse(profile: {
    id: string;
    userId: string;
    username: string;
    bio: string | null;
    avatarUrl: string | null;
    localArea: string | null;
    showLocalArea: boolean;
    createdAt: Date;
    updatedAt: Date;
    user: {
      displayName: string;
    };
  }): PrivateProfileResponse {
    return {
      id: profile.id,
      userId: profile.userId,
      username: profile.username,
      displayName: profile.user.displayName,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      localArea: profile.localArea,
      showLocalArea: profile.showLocalArea,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  private toPublicResponse(profile: {
    id: string;
    userId: string;
    username: string;
    bio: string | null;
    avatarUrl: string | null;
    localArea: string | null;
    showLocalArea: boolean;
    createdAt: Date;
    updatedAt: Date;
    user: {
      displayName: string;
    };
  }): PublicProfileResponse {
    return {
      id: profile.id,
      userId: profile.userId,
      username: profile.username,
      displayName: profile.user.displayName,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      localArea: profile.showLocalArea
        ? profile.localArea
        : null,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}
EOF

cat > services/api/src/profile/profile.controller.ts <<'EOF'
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type {
  PrivateProfileResponse,
  PublicProfileResponse,
} from './interfaces/profile-response.interface';
import { ProfileService } from './profile.service';

@Controller('profiles')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('me')
  findMine(
    @CurrentUser() user: AuthUser,
  ): Promise<PrivateProfileResponse> {
    return this.profileService.findMine(user.id);
  }

  @Patch('me')
  updateMine(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<PrivateProfileResponse> {
    return this.profileService.updateMine(user.id, dto);
  }

  @Public()
  @Get(':username')
  findPublicByUsername(
    @Param('username') username: string,
  ): Promise<PublicProfileResponse> {
    return this.profileService.findPublicByUsername(username);
  }
}
EOF

cat > services/api/src/profile/profile.module.ts <<'EOF'
import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
EOF

cat > services/api/test/profile.dto.test.ts <<'EOF'
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { UpdateProfileDto } from '../src/profile/dto/update-profile.dto';

describe('UpdateProfileDto', () => {
  it('normalises a valid profile update', async () => {
    const dto = plainToInstance(UpdateProfileDto, {
      username: '  Jason.Greaves  ',
      bio: '  Manchester neighbour and community builder.  ',
      avatarUrl: 'https://example.com/avatar.jpg',
      localArea: '  Blackley  ',
      showLocalArea: true,
    });

    const errors = await validate(dto);

    assert.equal(errors.length, 0);
    assert.equal(dto.username, 'jason.greaves');
    assert.equal(
      dto.bio,
      'Manchester neighbour and community builder.',
    );
    assert.equal(dto.localArea, 'Blackley');
    assert.equal(dto.showLocalArea, true);
  });

  it('rejects a username containing spaces', async () => {
    const dto = plainToInstance(UpdateProfileDto, {
      username: 'invalid username',
    });

    const errors = await validate(dto);

    assert.ok(
      errors.some((error) => error.property === 'username'),
    );
  });

  it('rejects an invalid avatar URL', async () => {
    const dto = plainToInstance(UpdateProfileDto, {
      avatarUrl: 'not-a-url',
    });

    const errors = await validate(dto);

    assert.ok(
      errors.some((error) => error.property === 'avatarUrl'),
    );
  });
});
EOF

cat > services/api/test/profile-username.test.ts <<'EOF'
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createUsernameCandidate,
  normaliseUsername,
} from '../src/profile/utils/profile-username.util';

describe('profile username utilities', () => {
  it('normalises usernames', () => {
    assert.equal(
      normaliseUsername('  Jason.Greaves  '),
      'jason.greaves',
    );
  });

  it('creates a stable username candidate', () => {
    assert.equal(
      createUsernameCandidate(
        'Jason-Paul Greaves',
        '12345678-1234-1234-1234-123456789012',
      ),
      'jason.paul.greaves.12345678',
    );
  });

  it('creates a safe fallback username', () => {
    assert.equal(
      createUsernameCandidate(
        '***',
        'abcdef12-1234-1234-1234-123456789012',
      ),
      'neighbour.abcdef12',
    );
  });
});
EOF

cat > docs/architecture/0006-user-profiles.md <<'EOF'
# Build 0006 — User Profiles and Neighbour Identity

## Purpose

Build 0006 separates public Neighbour™ identity from authentication data.

Authentication records remain responsible for:

- Email
- Password hash
- Platform role
- Account status
- Token relationships

The new profile record is responsible for:

- Public username
- Display name presentation
- Biography
- Avatar reference
- Local-area information
- Location visibility preference

## Data model

Each user may have exactly one `UserProfile`.

The profile uses:

- A unique `userId`
- A unique public `username`
- Cascade deletion when the user is deleted
- Optional biography, avatar URL and local area
- A `showLocalArea` privacy control

## Profile creation

Profiles are created lazily.

When an authenticated user requests `/api/v1/profiles/me` for the first
time, the API creates a profile automatically using a generated username.

The generated username combines:

1. A normalised form of the display name.
2. A short stable portion of the user ID.

## Privacy

Private profile responses include:

- Local area
- Location visibility preference

Public responses never include:

- Email address
- Password hash
- Authentication tokens
- Platform role
- Account administration data
- Hidden local-area information

When `showLocalArea` is false, the public `localArea` value is returned
as `null`.

## API routes

| Method | Route | Access |
| --- | --- | --- |
| GET | `/api/v1/profiles/me` | Authenticated |
| PATCH | `/api/v1/profiles/me` | Authenticated |
| GET | `/api/v1/profiles/:username` | Public |

## Validation

Usernames:

- Must contain between 3 and 30 characters.
- Are stored in lowercase.
- May contain letters, numbers, full stops and underscores.
- Cannot start or end with punctuation.
- Must be globally unique.

Biographies are limited to 500 characters.

Local-area descriptions are limited to 100 characters.

Avatar references must be valid HTTP or HTTPS URLs.

## Future extension

The profile domain will later support:

- Uploaded avatar assets
- Verification badges
- Community contribution summaries
- Neighbour reputation
- Business identity links
- Profile blocking
- Profile reporting
EOF

echo "Registering ProfileModule..."

python3 - <<'PY'
from pathlib import Path

path = Path("services/api/src/app.module.ts")
text = path.read_text()

profile_import = "import { ProfileModule } from './profile/profile.module';\n"

if profile_import not in text:
    anchor = "import { HealthModule } from './health/health.module';\n"
    text = text.replace(anchor, anchor + profile_import)

if "    ProfileModule,\n" not in text:
    text = text.replace(
        "    HealthModule,\n",
        "    HealthModule,\n    ProfileModule,\n",
    )

path.write_text(text)
PY

echo "Formatting the Prisma schema..."

pnpm --filter @neighbour/api exec prisma format

echo "Creating and applying the Build 0006 database migration..."

pnpm --filter @neighbour/api db:migrate -- --name user_profiles

echo "Regenerating the Prisma client..."

pnpm --filter @neighbour/api db:generate

echo "Formatting and validating Build 0006..."

pnpm format
pnpm check

echo
echo "Neighbour™ Build 0006 completed successfully."
echo "User Profiles and Neighbour Identity are ready."