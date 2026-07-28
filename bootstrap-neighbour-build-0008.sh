#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="${HOME}/Documents/neighbour"

cd "${PROJECT_ROOT}"

echo "Building Neighbour™ Build 0008 — Posts and Community Feed..."

mkdir -p services/api/src/post/dto
mkdir -p services/api/src/post/interfaces
mkdir -p services/api/src/post/utils
mkdir -p services/api/test
mkdir -p docs/architecture

echo "Extending Prisma schema with posts..."

python3 - <<'PY'
from pathlib import Path

path = Path("services/api/prisma/schema.prisma")
text = path.read_text()

if "enum PostStatus" not in text:
    enum_anchor = """enum ConnectionStatus {
  PENDING
  CONNECTED
  DECLINED
}
"""

    enum_addition = """
enum PostStatus {
  DRAFT
  PUBLISHED
}

enum PostVisibility {
  PUBLIC
  CONNECTIONS
  COMMUNITY
  PRIVATE
}
"""

    if enum_anchor not in text:
        raise SystemExit("Could not locate ConnectionStatus enum.")

    text = text.replace(enum_anchor, enum_anchor + enum_addition)

if not any(
    line.strip().startswith("posts") and "Post[]" in line
    for line in text[text.index("model User {"):text.index("model UserProfile {")].splitlines()
):
    user_start = text.index("model User {")
    user_end = text.index("\n}", user_start)

    user_model = text[user_start:user_end]
    anchor = next(
        (
            line
            for line in user_model.splitlines()
            if line.strip().startswith("blocksReceived")
        ),
        None,
    )

    if anchor is None:
        raise SystemExit("Could not locate User block relations.")

    text = text[:user_start] + user_model.replace(
        anchor,
        anchor + "\n  posts               Post[]",
        1,
    ) + text[user_end:]

community_start = text.index("model Community {")
community_end = text.index("\n}", community_start)
community_model = text[community_start:community_end]

if not any(
    line.strip().startswith("posts") and "Post[]" in line
    for line in community_model.splitlines()
):
    anchor = next(
        (
            line
            for line in community_model.splitlines()
            if line.strip().startswith("memberships")
        ),
        None,
    )

    if anchor is None:
        raise SystemExit("Could not locate Community memberships relation.")

    text = text[:community_start] + community_model.replace(
        anchor,
        anchor + "\n  posts       Post[]",
        1,
    ) + text[community_end:]

if "model Post {" not in text:
    post_model = """

model Post {
  id          String         @id @default(uuid()) @db.Uuid
  authorId    String         @db.Uuid
  communityId String?        @db.Uuid
  title       String?
  content     String
  status      PostStatus     @default(DRAFT)
  visibility  PostVisibility @default(PUBLIC)
  publishedAt DateTime?
  editedAt    DateTime?
  deletedAt   DateTime?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  author      User           @relation(fields: [authorId], references: [id], onDelete: Cascade)
  community   Community?     @relation(fields: [communityId], references: [id], onDelete: Cascade)

  @@index([authorId, status, publishedAt])
  @@index([communityId, status, publishedAt])
  @@index([status, visibility, publishedAt])
  @@index([deletedAt])
  @@map("posts")
}
"""

    text = text.rstrip() + post_model + "\n"

path.write_text(text)
PY

echo "Creating post DTOs..."

cat > services/api/src/post/dto/create-post.dto.ts <<'EOF'
import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';

export const postStatuses = ['DRAFT', 'PUBLISHED'] as const;
export const postVisibilities = [
  'PUBLIC',
  'CONNECTIONS',
  'COMMUNITY',
  'PRIVATE',
] as const;

export type PostStatusValue = (typeof postStatuses)[number];
export type PostVisibilityValue = (typeof postVisibilities)[number];

export class CreatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsString()
  @Length(1, 10000)
  content!: string;

  @IsOptional()
  @IsUUID()
  communityId?: string;

  @IsOptional()
  @IsIn(postStatuses)
  status?: PostStatusValue;

  @IsOptional()
  @IsIn(postVisibilities)
  visibility?: PostVisibilityValue;
}
EOF

cat > services/api/src/post/dto/update-post.dto.ts <<'EOF'
import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';

import {
  postStatuses,
  postVisibilities,
  type PostStatusValue,
  type PostVisibilityValue,
} from './create-post.dto';

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string | null;

  @IsOptional()
  @IsString()
  @Length(1, 10000)
  content?: string;

  @IsOptional()
  @IsUUID()
  communityId?: string | null;

  @IsOptional()
  @IsIn(postStatuses)
  status?: PostStatusValue;

  @IsOptional()
  @IsIn(postVisibilities)
  visibility?: PostVisibilityValue;
}
EOF

cat > services/api/src/post/dto/feed-query.dto.ts <<'EOF'
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class FeedQueryDto {
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 20;
}
EOF

echo "Creating post response contracts..."

cat > services/api/src/post/interfaces/post-response.interface.ts <<'EOF'
export type PostStatusResponse = 'DRAFT' | 'PUBLISHED';

export type PostVisibilityResponse =
  | 'PUBLIC'
  | 'CONNECTIONS'
  | 'COMMUNITY'
  | 'PRIVATE';

export interface PostAuthorResponse {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  localArea: string | null;
}

export interface PostCommunityResponse {
  id: string;
  name: string;
  slug: string;
}

export interface PostResponse {
  id: string;
  title: string | null;
  content: string;
  status: PostStatusResponse;
  visibility: PostVisibilityResponse;
  author: PostAuthorResponse;
  community: PostCommunityResponse | null;
  publishedAt: Date | null;
  editedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeedResponse {
  items: PostResponse[];
  nextCursor: string | null;
}
EOF

echo "Creating cursor pagination utility..."

cat > services/api/src/post/utils/feed-pagination.util.ts <<'EOF'
export interface PaginationInput {
  cursor?: string;
  limit?: number;
}

export interface PrismaCursorPagination {
  take: number;
  skip?: number;
  cursor?: {
    id: string;
  };
}

export function createCursorPagination(
  input: PaginationInput,
): PrismaCursorPagination {
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 50);

  if (!input.cursor) {
    return {
      take: limit + 1,
    };
  }

  return {
    take: limit + 1,
    skip: 1,
    cursor: {
      id: input.cursor,
    },
  };
}

export function extractPage<T extends { id: string }>(
  records: T[],
  limit = 20,
): {
  items: T[];
  nextCursor: string | null;
} {
  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const hasNextPage = records.length > safeLimit;
  const items = hasNextPage ? records.slice(0, safeLimit) : records;

  return {
    items,
    nextCursor:
      hasNextPage && items.length > 0
        ? items[items.length - 1]?.id ?? null
        : null,
  };
}
EOF

echo "Creating posts service..."

cat > services/api/src/post/post.service.ts <<'EOF'
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  MembershipStatus,
  PostStatus,
  PostVisibility,
  Prisma,
} from '../generated/prisma/client';
import { DatabaseService } from '../database/database.service';
import type { CreatePostDto } from './dto/create-post.dto';
import type { FeedQueryDto } from './dto/feed-query.dto';
import type { UpdatePostDto } from './dto/update-post.dto';
import type {
  FeedResponse,
  PostResponse,
} from './interfaces/post-response.interface';
import {
  createCursorPagination,
  extractPage,
} from './utils/feed-pagination.util';

const postInclude = {
  author: {
    include: {
      profile: true,
    },
  },
  community: true,
} satisfies Prisma.PostInclude;

type PostWithRelations = Prisma.PostGetPayload<{
  include: typeof postInclude;
}>;

@Injectable()
export class PostService {
  constructor(
    @Inject(DatabaseService)
    private readonly database: DatabaseService,
  ) {}

  async create(
    currentUserId: string,
    dto: CreatePostDto,
  ): Promise<PostResponse> {
    const status = dto.status ?? 'PUBLISHED';
    const visibility = this.resolveVisibility(
      dto.visibility,
      dto.communityId,
    );

    if (dto.communityId) {
      await this.requireActiveCommunityMembership(
        currentUserId,
        dto.communityId,
      );
    }

    this.validateCommunityVisibility(
      dto.communityId ?? null,
      visibility,
    );

    const post = await this.database.post.create({
      data: {
        authorId: currentUserId,
        communityId: dto.communityId,
        title: this.normaliseOptionalText(dto.title),
        content: dto.content.trim(),
        status,
        visibility,
        publishedAt:
          status === PostStatus.PUBLISHED ? new Date() : null,
      },
      include: postInclude,
    });

    return this.toPostResponse(post);
  }

  async update(
    currentUserId: string,
    postId: string,
    dto: UpdatePostDto,
  ): Promise<PostResponse> {
    const existing = await this.requireOwnedPost(
      currentUserId,
      postId,
    );

    const nextCommunityId =
      dto.communityId === undefined
        ? existing.communityId
        : dto.communityId;

    const nextVisibility = this.resolveVisibility(
      dto.visibility ?? existing.visibility,
      nextCommunityId ?? undefined,
    );

    if (nextCommunityId) {
      await this.requireActiveCommunityMembership(
        currentUserId,
        nextCommunityId,
      );
    }

    this.validateCommunityVisibility(
      nextCommunityId,
      nextVisibility,
    );

    const nextStatus = dto.status ?? existing.status;
    const isPublishing =
      existing.status !== PostStatus.PUBLISHED &&
      nextStatus === PostStatus.PUBLISHED;

    const contentChanged =
      dto.content !== undefined &&
      dto.content.trim() !== existing.content;

    const titleChanged =
      dto.title !== undefined &&
      this.normaliseOptionalText(dto.title) !== existing.title;

    const placementChanged =
      dto.communityId !== undefined ||
      dto.visibility !== undefined;

    const post = await this.database.post.update({
      where: {
        id: postId,
      },
      data: {
        title:
          dto.title === undefined
            ? undefined
            : this.normaliseOptionalText(dto.title),
        content:
          dto.content === undefined
            ? undefined
            : dto.content.trim(),
        communityId:
          dto.communityId === undefined
            ? undefined
            : dto.communityId,
        status: dto.status,
        visibility: dto.visibility
          ? nextVisibility
          : placementChanged
            ? nextVisibility
            : undefined,
        publishedAt: isPublishing
          ? new Date()
          : nextStatus === PostStatus.DRAFT
            ? null
            : existing.publishedAt,
        editedAt:
          contentChanged || titleChanged || placementChanged
            ? new Date()
            : existing.editedAt,
      },
      include: postInclude,
    });

    return this.toPostResponse(post);
  }

  async softDelete(
    currentUserId: string,
    postId: string,
  ): Promise<void> {
    await this.requireOwnedPost(currentUserId, postId);

    await this.database.post.update({
      where: {
        id: postId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async findOne(
    currentUserId: string,
    postId: string,
  ): Promise<PostResponse> {
    const post = await this.database.post.findFirst({
      where: {
        id: postId,
        deletedAt: null,
      },
      include: postInclude,
    });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    const canView = await this.canViewPost(currentUserId, post);

    if (!canView) {
      throw new NotFoundException('Post not found.');
    }

    return this.toPostResponse(post);
  }

  async getHomeFeed(
    currentUserId: string,
    query: FeedQueryDto,
  ): Promise<FeedResponse> {
    const [connections, memberships] = await Promise.all([
      this.database.connection.findMany({
        where: {
          status: 'CONNECTED',
          OR: [
            { userAId: currentUserId },
            { userBId: currentUserId },
          ],
        },
        select: {
          userAId: true,
          userBId: true,
        },
      }),
      this.database.membership.findMany({
        where: {
          userId: currentUserId,
          status: MembershipStatus.ACTIVE,
        },
        select: {
          communityId: true,
        },
      }),
    ]);

    const connectedUserIds = connections.map((connection) =>
      connection.userAId === currentUserId
        ? connection.userBId
        : connection.userAId,
    );

    const communityIds = memberships.map(
      (membership) => membership.communityId,
    );

    const pagination = createCursorPagination(query);

    const visibilityFilters: Prisma.PostWhereInput[] = [
      {
        authorId: currentUserId,
      },
      {
        visibility: PostVisibility.PUBLIC,
      },
    ];

    if (connectedUserIds.length > 0) {
      visibilityFilters.push({
        visibility: PostVisibility.CONNECTIONS,
        authorId: {
          in: connectedUserIds,
        },
      });
    }

    if (communityIds.length > 0) {
      visibilityFilters.push({
        visibility: PostVisibility.COMMUNITY,
        communityId: {
          in: communityIds,
        },
      });
    }

    const posts = await this.database.post.findMany({
      where: {
        status: PostStatus.PUBLISHED,
        deletedAt: null,
        OR: visibilityFilters,
      },
      include: postInclude,
      orderBy: [
        {
          publishedAt: 'desc',
        },
        {
          id: 'desc',
        },
      ],
      ...pagination,
    });

    return this.toFeedResponse(posts, query.limit);
  }

  async getCommunityFeed(
    currentUserId: string,
    communitySlug: string,
    query: FeedQueryDto,
  ): Promise<FeedResponse> {
    const community = await this.database.community.findUnique({
      where: {
        slug: communitySlug.toLowerCase(),
      },
      select: {
        id: true,
        visibility: true,
      },
    });

    if (!community) {
      throw new NotFoundException('Community not found.');
    }

    const membership =
      await this.database.membership.findUnique({
        where: {
          userId_communityId: {
            userId: currentUserId,
            communityId: community.id,
          },
        },
        select: {
          status: true,
        },
      });

    const isActiveMember =
      membership?.status === MembershipStatus.ACTIVE;

    if (
      community.visibility === 'PRIVATE' &&
      !isActiveMember
    ) {
      throw new ForbiddenException(
        'You must be an active member to view this community feed.',
      );
    }

    const pagination = createCursorPagination(query);

    const posts = await this.database.post.findMany({
      where: {
        communityId: community.id,
        status: PostStatus.PUBLISHED,
        deletedAt: null,
        OR: [
          {
            visibility: PostVisibility.PUBLIC,
          },
          ...(isActiveMember
            ? [
                {
                  visibility: PostVisibility.COMMUNITY,
                },
              ]
            : []),
          {
            authorId: currentUserId,
          },
        ],
      },
      include: postInclude,
      orderBy: [
        {
          publishedAt: 'desc',
        },
        {
          id: 'desc',
        },
      ],
      ...pagination,
    });

    return this.toFeedResponse(posts, query.limit);
  }

  async getProfilePosts(
    currentUserId: string,
    username: string,
    query: FeedQueryDto,
  ): Promise<FeedResponse> {
    const profile = await this.database.userProfile.findUnique({
      where: {
        username: username.toLowerCase(),
      },
      select: {
        userId: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found.');
    }

    const isOwner = profile.userId === currentUserId;

    const relationship = isOwner
      ? null
      : await this.database.connection.findFirst({
          where: {
            status: 'CONNECTED',
            OR: [
              {
                userAId: currentUserId,
                userBId: profile.userId,
              },
              {
                userAId: profile.userId,
                userBId: currentUserId,
              },
            ],
          },
          select: {
            id: true,
          },
        });

    const pagination = createCursorPagination(query);

    const visibilityFilters: Prisma.PostWhereInput[] = [
      {
        visibility: PostVisibility.PUBLIC,
      },
    ];

    if (isOwner) {
      visibilityFilters.push({
        authorId: currentUserId,
      });
    } else if (relationship) {
      visibilityFilters.push({
        visibility: PostVisibility.CONNECTIONS,
      });
    }

    const posts = await this.database.post.findMany({
      where: {
        authorId: profile.userId,
        deletedAt: null,
        ...(isOwner
          ? {}
          : {
              status: PostStatus.PUBLISHED,
            }),
        OR: visibilityFilters,
      },
      include: postInclude,
      orderBy: [
        {
          publishedAt: 'desc',
        },
        {
          createdAt: 'desc',
        },
        {
          id: 'desc',
        },
      ],
      ...pagination,
    });

    return this.toFeedResponse(posts, query.limit);
  }

  async getMyDrafts(
    currentUserId: string,
    query: FeedQueryDto,
  ): Promise<FeedResponse> {
    const pagination = createCursorPagination(query);

    const posts = await this.database.post.findMany({
      where: {
        authorId: currentUserId,
        status: PostStatus.DRAFT,
        deletedAt: null,
      },
      include: postInclude,
      orderBy: [
        {
          updatedAt: 'desc',
        },
        {
          id: 'desc',
        },
      ],
      ...pagination,
    });

    return this.toFeedResponse(posts, query.limit);
  }

  private async canViewPost(
    currentUserId: string,
    post: PostWithRelations,
  ): Promise<boolean> {
    if (post.authorId === currentUserId) {
      return true;
    }

    if (post.status !== PostStatus.PUBLISHED) {
      return false;
    }

    if (post.visibility === PostVisibility.PUBLIC) {
      return true;
    }

    if (post.visibility === PostVisibility.PRIVATE) {
      return false;
    }

    if (post.visibility === PostVisibility.CONNECTIONS) {
      const connection =
        await this.database.connection.findFirst({
          where: {
            status: 'CONNECTED',
            OR: [
              {
                userAId: currentUserId,
                userBId: post.authorId,
              },
              {
                userAId: post.authorId,
                userBId: currentUserId,
              },
            ],
          },
          select: {
            id: true,
          },
        });

      return Boolean(connection);
    }

    if (
      post.visibility === PostVisibility.COMMUNITY &&
      post.communityId
    ) {
      const membership =
        await this.database.membership.findUnique({
          where: {
            userId_communityId: {
              userId: currentUserId,
              communityId: post.communityId,
            },
          },
          select: {
            status: true,
          },
        });

      return membership?.status === MembershipStatus.ACTIVE;
    }

    return false;
  }

  private async requireOwnedPost(
    currentUserId: string,
    postId: string,
  ) {
    const post = await this.database.post.findFirst({
      where: {
        id: postId,
        authorId: currentUserId,
        deletedAt: null,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    return post;
  }

  private async requireActiveCommunityMembership(
    userId: string,
    communityId: string,
  ): Promise<void> {
    const membership =
      await this.database.membership.findUnique({
        where: {
          userId_communityId: {
            userId,
            communityId,
          },
        },
        select: {
          status: true,
        },
      });

    if (
      !membership ||
      membership.status !== MembershipStatus.ACTIVE
    ) {
      throw new ForbiddenException(
        'You must be an active community member to post there.',
      );
    }
  }

  private resolveVisibility(
    requestedVisibility:
      | 'PUBLIC'
      | 'CONNECTIONS'
      | 'COMMUNITY'
      | 'PRIVATE'
      | undefined,
    communityId: string | undefined,
  ): PostVisibility {
    if (requestedVisibility) {
      return requestedVisibility as PostVisibility;
    }

    return communityId
      ? PostVisibility.COMMUNITY
      : PostVisibility.PUBLIC;
  }

  private validateCommunityVisibility(
    communityId: string | null,
    visibility: PostVisibility,
  ): void {
    if (
      visibility === PostVisibility.COMMUNITY &&
      !communityId
    ) {
      throw new BadRequestException(
        'Community visibility requires a community.',
      );
    }

    if (
      communityId &&
      visibility === PostVisibility.CONNECTIONS
    ) {
      throw new BadRequestException(
        'Community posts cannot use connections-only visibility.',
      );
    }

    if (
      communityId &&
      visibility === PostVisibility.PRIVATE
    ) {
      throw new BadRequestException(
        'Private drafts should not be attached to a community.',
      );
    }
  }

  private normaliseOptionalText(
    value: string | null | undefined,
  ): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : null;
  }

  private toFeedResponse(
    posts: PostWithRelations[],
    limit: number,
  ): FeedResponse {
    const page = extractPage(posts, limit);

    return {
      items: page.items.map((post) =>
        this.toPostResponse(post),
      ),
      nextCursor: page.nextCursor,
    };
  }

  private toPostResponse(
    post: PostWithRelations,
  ): PostResponse {
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      status: post.status,
      visibility: post.visibility,
      author: {
        id: post.author.id,
        displayName: post.author.displayName,
        username: post.author.profile?.username ?? null,
        avatarUrl: post.author.profile?.avatarUrl ?? null,
        localArea:
          post.author.profile?.showLocalArea === true
            ? post.author.profile.localArea
            : null,
      },
      community: post.community
        ? {
            id: post.community.id,
            name: post.community.name,
            slug: post.community.slug,
          }
        : null,
      publishedAt: post.publishedAt,
      editedAt: post.editedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }
}
EOF

echo "Creating post controllers..."

cat > services/api/src/post/post.controller.ts <<'EOF'
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CreatePostDto } from './dto/create-post.dto';
import { FeedQueryDto } from './dto/feed-query.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import type {
  FeedResponse,
  PostResponse,
} from './interfaces/post-response.interface';
import { PostService } from './post.service';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreatePostDto,
  ): Promise<PostResponse> {
    return this.postService.create(user.id, dto);
  }

  @Get('drafts')
  getMyDrafts(
    @CurrentUser() user: AuthUser,
    @Query() query: FeedQueryDto,
  ): Promise<FeedResponse> {
    return this.postService.getMyDrafts(user.id, query);
  }

  @Get(':postId')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('postId') postId: string,
  ): Promise<PostResponse> {
    return this.postService.findOne(user.id, postId);
  }

  @Patch(':postId')
  update(
    @CurrentUser() user: AuthUser,
    @Param('postId') postId: string,
    @Body() dto: UpdatePostDto,
  ): Promise<PostResponse> {
    return this.postService.update(user.id, postId, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':postId')
  softDelete(
    @CurrentUser() user: AuthUser,
    @Param('postId') postId: string,
  ): Promise<void> {
    return this.postService.softDelete(user.id, postId);
  }
}
EOF

cat > services/api/src/post/feed.controller.ts <<'EOF'
import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { FeedQueryDto } from './dto/feed-query.dto';
import type { FeedResponse } from './interfaces/post-response.interface';
import { PostService } from './post.service';

@Controller()
export class FeedController {
  constructor(private readonly postService: PostService) {}

  @Get('feed')
  getHomeFeed(
    @CurrentUser() user: AuthUser,
    @Query() query: FeedQueryDto,
  ): Promise<FeedResponse> {
    return this.postService.getHomeFeed(user.id, query);
  }

  @Get('communities/:slug/feed')
  getCommunityFeed(
    @CurrentUser() user: AuthUser,
    @Param('slug') slug: string,
    @Query() query: FeedQueryDto,
  ): Promise<FeedResponse> {
    return this.postService.getCommunityFeed(
      user.id,
      slug,
      query,
    );
  }

  @Get('profiles/:username/posts')
  getProfilePosts(
    @CurrentUser() user: AuthUser,
    @Param('username') username: string,
    @Query() query: FeedQueryDto,
  ): Promise<FeedResponse> {
    return this.postService.getProfilePosts(
      user.id,
      username,
      query,
    );
  }
}
EOF

cat > services/api/src/post/post.module.ts <<'EOF'
import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { FeedController } from './feed.controller';
import { PostController } from './post.controller';
import { PostService } from './post.service';

@Module({
  imports: [DatabaseModule],
  controllers: [PostController, FeedController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}
EOF

echo "Registering PostModule..."

python3 - <<'PY'
from pathlib import Path

path = Path("services/api/src/app.module.ts")
text = path.read_text()

import_line = "import { PostModule } from './post/post.module';\n"

if import_line not in text:
    anchor = "import { ProfileModule } from './profile/profile.module';\n"

    if anchor not in text:
        raise SystemExit("Could not locate ProfileModule import.")

    text = text.replace(anchor, anchor + import_line)

if "    PostModule,\n" not in text:
    anchor = "    ProfileModule,\n"

    if anchor not in text:
        raise SystemExit("Could not locate ProfileModule registration.")

    text = text.replace(anchor, anchor + "    PostModule,\n")

path.write_text(text)
PY

echo "Creating automated tests..."

cat > services/api/test/feed-pagination.test.ts <<'EOF'
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createCursorPagination,
  extractPage,
} from '../src/post/utils/feed-pagination.util';

describe('feed cursor pagination', () => {
  it('requests one extra record to detect another page', () => {
    assert.deepEqual(createCursorPagination({ limit: 20 }), {
      take: 21,
    });
  });

  it('uses a cursor and skips the cursor record', () => {
    assert.deepEqual(
      createCursorPagination({
        cursor: '11111111-1111-4111-8111-111111111111',
        limit: 10,
      }),
      {
        take: 11,
        skip: 1,
        cursor: {
          id: '11111111-1111-4111-8111-111111111111',
        },
      },
    );
  });

  it('limits page size to fifty records', () => {
    assert.deepEqual(createCursorPagination({ limit: 100 }), {
      take: 51,
    });
  });

  it('returns a next cursor when another page exists', () => {
    const result = extractPage(
      [
        { id: 'post-1' },
        { id: 'post-2' },
        { id: 'post-3' },
      ],
      2,
    );

    assert.deepEqual(result, {
      items: [
        { id: 'post-1' },
        { id: 'post-2' },
      ],
      nextCursor: 'post-2',
    });
  });

  it('returns no cursor on the final page', () => {
    const result = extractPage(
      [
        { id: 'post-1' },
        { id: 'post-2' },
      ],
      2,
    );

    assert.equal(result.nextCursor, null);
  });
});
EOF

cat > services/api/test/post-contracts.test.ts <<'EOF'
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  postStatuses,
  postVisibilities,
} from '../src/post/dto/create-post.dto';
import type {
  FeedResponse,
  PostResponse,
} from '../src/post/interfaces/post-response.interface';

describe('post contracts', () => {
  it('defines draft and published states', () => {
    assert.deepEqual(postStatuses, [
      'DRAFT',
      'PUBLISHED',
    ]);
  });

  it('defines supported visibility states', () => {
    assert.deepEqual(postVisibilities, [
      'PUBLIC',
      'CONNECTIONS',
      'COMMUNITY',
      'PRIVATE',
    ]);
  });

  it('supports a privacy-safe post response', () => {
    const post: PostResponse = {
      id: 'post-id',
      title: 'Welcome',
      content: 'Hello, neighbours.',
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      author: {
        id: 'author-id',
        displayName: 'Neighbour Member',
        username: 'neighbour-member',
        avatarUrl: null,
        localArea: null,
      },
      community: null,
      publishedAt: new Date('2026-07-28T00:00:00.000Z'),
      editedAt: null,
      createdAt: new Date('2026-07-28T00:00:00.000Z'),
      updatedAt: new Date('2026-07-28T00:00:00.000Z'),
    };

    const feed: FeedResponse = {
      items: [post],
      nextCursor: null,
    };

    assert.equal(feed.items[0]?.content, 'Hello, neighbours.');
    assert.equal(feed.items[0]?.author.localArea, null);
  });
});
EOF

echo "Creating architecture documentation..."

cat > docs/architecture/0008-posts-feed.md <<'EOF'
# Neighbour™ Architecture Decision 0008

## Posts and Community Feed

Build 0008 establishes the first content publishing and feed layer for
Neighbour™.

## Objectives

The post engine supports:

- personal posts;
- community posts;
- optional post titles;
- draft and published states;
- editing;
- soft deletion;
- privacy-aware visibility;
- personal feeds;
- community feeds;
- profile post lists;
- cursor pagination.

## Post states

A post can be:

- `DRAFT`;
- `PUBLISHED`.

Draft posts are visible only to their author.

Publishing a draft assigns a `publishedAt` timestamp. Returning a published post
to draft state removes its publication timestamp.

## Post visibility

A post can use one of four visibility levels:

- `PUBLIC`;
- `CONNECTIONS`;
- `COMMUNITY`;
- `PRIVATE`.

### Public

Visible to authenticated Neighbour members.

### Connections

Visible to the author and users with an accepted two-way connection to the
author.

### Community

Visible to active members of the attached community.

### Private

Visible only to the author.

## Community posting

A user must hold an active membership in a community before creating or moving
a post into that community.

Community-only visibility requires a valid community.

Community posts cannot use connection-only visibility because community access
and social-graph access are separate permission domains.

## Feed composition

The main feed may contain:

- the current user's own published posts;
- public posts;
- connection-only posts created by accepted connections;
- community-only posts from communities where the user has active membership.

Drafts and soft-deleted posts are excluded.

## Community feed

A public community feed can be viewed by authenticated users, but non-members
receive only public posts.

Private community feeds require active membership.

Active members may receive both public and community-only posts.

## Profile posts

A profile post list provides:

- public published posts for ordinary viewers;
- connection-only posts for accepted connections;
- all undeleted posts, including drafts, for the profile owner.

## Soft deletion

Deleting a post sets `deletedAt`.

The database record remains available for future moderation, audit and recovery
systems, but normal post and feed queries exclude it.

## Cursor pagination

Feeds use post identifiers as Prisma cursors.

Each query retrieves one additional record beyond the requested page size. The
additional record determines whether a `nextCursor` should be returned.

Page sizes are restricted to between 1 and 50 posts.

## Privacy

Post responses expose only safe author information:

- user identifier;
- display name;
- username;
- avatar reference;
- local area only where local-area visibility is enabled.

Email addresses, authentication credentials, account roles and private user
data are excluded.

## API routes

All routes require authentication.

### Post management

- `POST /api/v1/posts`
- `GET /api/v1/posts/drafts`
- `GET /api/v1/posts/:postId`
- `PATCH /api/v1/posts/:postId`
- `DELETE /api/v1/posts/:postId`

### Feeds

- `GET /api/v1/feed`
- `GET /api/v1/communities/:slug/feed`
- `GET /api/v1/profiles/:username/posts`

## Future extensions

This foundation is intended to support:

- images and video;
- reactions;
- comments;
- post sharing;
- mentions;
- hashtags;
- feed ranking;
- moderation queues;
- reporting;
- pinned posts;
- scheduled publication;
- local-area feeds;
- business posts;
- sponsored content.
EOF

echo "Formatting Prisma schema..."

pnpm --filter @neighbour/api exec prisma format

echo "Creating and applying posts migration..."

pnpm --filter @neighbour/api exec prisma migrate dev --name posts_and_feed

echo "Generating Prisma client..."

pnpm --filter @neighbour/api db:generate

echo "Formatting and validating Build 0008..."

pnpm format
pnpm check

echo
echo "Neighbour™ Build 0008 completed successfully."
echo "Posts and Community Feed are ready."