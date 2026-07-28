#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${HOME}/Documents/neighbour"
cd "${ROOT_DIR}"

echo "Building Neighbour™ Build 0009 — Comments and Reactions..."

SCHEMA="services/api/prisma/schema.prisma"
APP_MODULE="services/api/src/app.module.ts"

python3 - <<'PY'
from pathlib import Path

schema_path = Path("services/api/prisma/schema.prisma")
text = schema_path.read_text()

def model_bounds(source: str, model_name: str):
    marker = f"model {model_name} {{"
    start = source.find(marker)
    if start == -1:
        raise SystemExit(f"Could not locate {model_name} model.")
    depth = 0
    end = None
    for index in range(start, len(source)):
        char = source[index]
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                end = index + 1
                break
    if end is None:
        raise SystemExit(f"Could not determine end of {model_name} model.")
    return start, end

def add_relation_field(source: str, model_name: str, anchor_prefix: str, field_line: str):
    start, end = model_bounds(source, model_name)
    block = source[start:end]
    if field_line.strip() in block:
        return source

    lines = block.splitlines()
    insert_at = None
    for index, line in enumerate(lines):
        if line.strip().startswith(anchor_prefix):
            insert_at = index + 1
            break

    if insert_at is None:
        raise SystemExit(
            f"Could not locate relation anchor '{anchor_prefix}' in {model_name} model."
        )

    lines.insert(insert_at, field_line)
    replacement = "\n".join(lines)
    return source[:start] + replacement + source[end:]

if "enum ReactionType {" not in text:
    post_visibility_end = text.find("}\n\nmodel User", text.find("enum PostVisibility {"))
    if post_visibility_end == -1:
        raise SystemExit("Could not locate enum insertion point.")

    reaction_enum = """}

enum ReactionType {
  LIKE
  LOVE
  SUPPORT
  CELEBRATE
  INSIGHTFUL
"""
    text = text[:post_visibility_end] + reaction_enum + text[post_visibility_end + 1:]

text = add_relation_field(
    text,
    "User",
    "posts",
    "  comments             Comment[]",
)
text = add_relation_field(
    text,
    "User",
    "comments",
    "  postReactions        PostReaction[]",
)
text = add_relation_field(
    text,
    "Post",
    "community",
    "  comments    Comment[]",
)
text = add_relation_field(
    text,
    "Post",
    "comments",
    "  reactions   PostReaction[]",
)

if "model Comment {" not in text:
    text = text.rstrip() + """

model Comment {
  id        String    @id @default(uuid()) @db.Uuid
  postId    String    @db.Uuid
  authorId  String    @db.Uuid
  parentId  String?   @db.Uuid
  content   String
  editedAt  DateTime?
  deletedAt DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  post      Post      @relation(fields: [postId], references: [id], onDelete: Cascade)
  author    User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  parent    Comment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies   Comment[] @relation("CommentReplies")

  @@index([postId, createdAt])
  @@index([authorId, createdAt])
  @@index([parentId, createdAt])
  @@index([deletedAt])
  @@map("comments")
}

model PostReaction {
  id        String       @id @default(uuid()) @db.Uuid
  postId    String       @db.Uuid
  userId    String       @db.Uuid
  type      ReactionType
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt
  post      Post         @relation(fields: [postId], references: [id], onDelete: Cascade)
  user      User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([postId, userId])
  @@index([postId, type])
  @@index([userId, createdAt])
  @@map("post_reactions")
}
"""

schema_path.write_text(text)
PY

mkdir -p \
  services/api/src/interaction/dto \
  services/api/src/interaction/interfaces \
  services/api/src/interaction/utils \
  services/api/test \
  docs/architecture

cat > services/api/src/interaction/dto/create-comment.dto.ts <<'EOF'
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
EOF

cat > services/api/src/interaction/dto/update-comment.dto.ts <<'EOF'
import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;
}
EOF

cat > services/api/src/interaction/dto/comment-query.dto.ts <<'EOF'
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class CommentQueryDto {
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 30;
}
EOF

cat > services/api/src/interaction/dto/set-reaction.dto.ts <<'EOF'
import { IsEnum } from 'class-validator';

import { ReactionType } from '../../generated/prisma/client';

export class SetReactionDto {
  @IsEnum(ReactionType)
  type!: ReactionType;
}
EOF

cat > services/api/src/interaction/interfaces/interaction-response.interface.ts <<'EOF'
import type { ReactionType } from '../../generated/prisma/client';

export interface InteractionAuthorResponse {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
}

export interface CommentResponse {
  id: string;
  postId: string;
  parentId: string | null;
  content: string;
  author: InteractionAuthorResponse;
  editedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentFeedResponse {
  items: CommentResponse[];
  nextCursor: string | null;
}

export interface ReactionResponse {
  postId: string;
  type: ReactionType;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReactionCountResponse {
  type: ReactionType;
  count: number;
}

export interface ReactionSummaryResponse {
  counts: ReactionCountResponse[];
  total: number;
  viewerReaction: ReactionType | null;
}
EOF

cat > services/api/src/interaction/interaction.service.ts <<'EOF'
import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { Prisma, ReactionType } from '../generated/prisma/client';
import { PostService } from '../post/post.service';
import type { CommentQueryDto } from './dto/comment-query.dto';
import type { CreateCommentDto } from './dto/create-comment.dto';
import type { SetReactionDto } from './dto/set-reaction.dto';
import type { UpdateCommentDto } from './dto/update-comment.dto';
import type {
  CommentFeedResponse,
  CommentResponse,
  ReactionResponse,
  ReactionSummaryResponse,
} from './interfaces/interaction-response.interface';

const commentInclude = {
  author: {
    include: {
      profile: true,
    },
  },
} satisfies Prisma.CommentInclude;

type CommentWithAuthor = Prisma.CommentGetPayload<{
  include: typeof commentInclude;
}>;

@Injectable()
export class InteractionService {
  constructor(
    @Inject(DatabaseService)
    private readonly database: DatabaseService,
    private readonly postService: PostService,
  ) {}

  async createComment(
    currentUserId: string,
    postId: string,
    dto: CreateCommentDto,
  ): Promise<CommentResponse> {
    await this.postService.findOne(currentUserId, postId);

    if (dto.parentId) {
      const parent = await this.database.comment.findFirst({
        where: {
          id: dto.parentId,
          postId,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

      if (!parent) {
        throw new NotFoundException('Parent comment not found.');
      }
    }

    const data: Prisma.CommentUncheckedCreateInput = {
      postId,
      authorId: currentUserId,
      parentId: dto.parentId ?? null,
      content: dto.content.trim(),
    };

    const created = await this.database.comment.create({
      data,
      select: {
        id: true,
      },
    });

    return this.requireCommentWithAuthor(created.id);
  }

  async listComments(
    currentUserId: string,
    postId: string,
    query: CommentQueryDto,
  ): Promise<CommentFeedResponse> {
    await this.postService.findOne(currentUserId, postId);

    const comments = await this.database.comment.findMany({
      where: {
        postId,
        deletedAt: null,
      },
      include: commentInclude,
      orderBy: [
        {
          createdAt: 'asc',
        },
        {
          id: 'asc',
        },
      ],
      take: query.limit + 1,
      ...(query.cursor
        ? {
            cursor: {
              id: query.cursor,
            },
            skip: 1,
          }
        : {}),
    });

    const hasMore = comments.length > query.limit;
    const items = hasMore ? comments.slice(0, query.limit) : comments;

    return {
      items: items.map((comment) => this.toCommentResponse(comment)),
      nextCursor: hasMore ? items.at(-1)?.id ?? null : null,
    };
  }

  async updateComment(
    currentUserId: string,
    commentId: string,
    dto: UpdateCommentDto,
  ): Promise<CommentResponse> {
    await this.requireOwnedComment(currentUserId, commentId);

    await this.database.comment.update({
      where: {
        id: commentId,
      },
      data: {
        content: dto.content.trim(),
        editedAt: new Date(),
      },
    });

    return this.requireCommentWithAuthor(commentId);
  }

  async deleteComment(currentUserId: string, commentId: string): Promise<void> {
    await this.requireOwnedComment(currentUserId, commentId);

    await this.database.comment.update({
      where: {
        id: commentId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async setReaction(
    currentUserId: string,
    postId: string,
    dto: SetReactionDto,
  ): Promise<ReactionResponse> {
    await this.postService.findOne(currentUserId, postId);

    const reaction = await this.database.postReaction.upsert({
      where: {
        postId_userId: {
          postId,
          userId: currentUserId,
        },
      },
      create: {
        postId,
        userId: currentUserId,
        type: dto.type,
      },
      update: {
        type: dto.type,
      },
    });

    return {
      postId: reaction.postId,
      type: reaction.type,
      createdAt: reaction.createdAt,
      updatedAt: reaction.updatedAt,
    };
  }

  async removeReaction(currentUserId: string, postId: string): Promise<void> {
    await this.postService.findOne(currentUserId, postId);

    await this.database.postReaction.deleteMany({
      where: {
        postId,
        userId: currentUserId,
      },
    });
  }

  async getReactionSummary(
    currentUserId: string,
    postId: string,
  ): Promise<ReactionSummaryResponse> {
    await this.postService.findOne(currentUserId, postId);

    const [groups, viewerReaction] = await Promise.all([
      this.database.postReaction.groupBy({
        by: ['type'],
        where: {
          postId,
        },
        _count: {
          _all: true,
        },
      }),
      this.database.postReaction.findUnique({
        where: {
          postId_userId: {
            postId,
            userId: currentUserId,
          },
        },
        select: {
          type: true,
        },
      }),
    ]);

    const countMap = new Map(
      groups.map((group) => [group.type, group._count._all]),
    );

    const counts = Object.values(ReactionType).map((type) => ({
      type,
      count: countMap.get(type) ?? 0,
    }));

    return {
      counts,
      total: counts.reduce((total, entry) => total + entry.count, 0),
      viewerReaction: viewerReaction?.type ?? null,
    };
  }

  private async requireOwnedComment(
    currentUserId: string,
    commentId: string,
  ): Promise<void> {
    const comment = await this.database.comment.findFirst({
      where: {
        id: commentId,
        authorId: currentUserId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found.');
    }
  }

  private async requireCommentWithAuthor(
    commentId: string,
  ): Promise<CommentResponse> {
    const comment = await this.database.comment.findUnique({
      where: {
        id: commentId,
      },
      include: commentInclude,
    });

    if (!comment || comment.deletedAt) {
      throw new NotFoundException('Comment not found.');
    }

    return this.toCommentResponse(comment);
  }

  private toCommentResponse(comment: CommentWithAuthor): CommentResponse {
    return {
      id: comment.id,
      postId: comment.postId,
      parentId: comment.parentId,
      content: comment.content,
      author: {
        id: comment.author.id,
        displayName: comment.author.displayName,
        username: comment.author.profile?.username ?? null,
        avatarUrl: comment.author.profile?.avatarUrl ?? null,
      },
      editedAt: comment.editedAt,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }
}
EOF

cat > services/api/src/interaction/interaction.controller.ts <<'EOF'
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
  Put,
  Query,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CommentQueryDto } from './dto/comment-query.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { SetReactionDto } from './dto/set-reaction.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import type {
  CommentFeedResponse,
  CommentResponse,
  ReactionResponse,
  ReactionSummaryResponse,
} from './interfaces/interaction-response.interface';
import { InteractionService } from './interaction.service';

@Controller()
export class InteractionController {
  constructor(private readonly interactionService: InteractionService) {}

  @Post('posts/:postId/comments')
  createComment(
    @CurrentUser() user: AuthUser,
    @Param('postId') postId: string,
    @Body() dto: CreateCommentDto,
  ): Promise<CommentResponse> {
    return this.interactionService.createComment(user.id, postId, dto);
  }

  @Get('posts/:postId/comments')
  listComments(
    @CurrentUser() user: AuthUser,
    @Param('postId') postId: string,
    @Query() query: CommentQueryDto,
  ): Promise<CommentFeedResponse> {
    return this.interactionService.listComments(user.id, postId, query);
  }

  @Patch('comments/:commentId')
  updateComment(
    @CurrentUser() user: AuthUser,
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
  ): Promise<CommentResponse> {
    return this.interactionService.updateComment(user.id, commentId, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('comments/:commentId')
  deleteComment(
    @CurrentUser() user: AuthUser,
    @Param('commentId') commentId: string,
  ): Promise<void> {
    return this.interactionService.deleteComment(user.id, commentId);
  }

  @Put('posts/:postId/reaction')
  setReaction(
    @CurrentUser() user: AuthUser,
    @Param('postId') postId: string,
    @Body() dto: SetReactionDto,
  ): Promise<ReactionResponse> {
    return this.interactionService.setReaction(user.id, postId, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('posts/:postId/reaction')
  removeReaction(
    @CurrentUser() user: AuthUser,
    @Param('postId') postId: string,
  ): Promise<void> {
    return this.interactionService.removeReaction(user.id, postId);
  }

  @Get('posts/:postId/reactions')
  getReactionSummary(
    @CurrentUser() user: AuthUser,
    @Param('postId') postId: string,
  ): Promise<ReactionSummaryResponse> {
    return this.interactionService.getReactionSummary(user.id, postId);
  }
}
EOF

cat > services/api/src/interaction/interaction.module.ts <<'EOF'
import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { PostModule } from '../post/post.module';
import { InteractionController } from './interaction.controller';
import { InteractionService } from './interaction.service';

@Module({
  imports: [DatabaseModule, PostModule],
  controllers: [InteractionController],
  providers: [InteractionService],
  exports: [InteractionService],
})
export class InteractionModule {}
EOF

python3 - <<'PY'
from pathlib import Path

path = Path("services/api/src/app.module.ts")
text = path.read_text()

import_line = "import { InteractionModule } from './interaction/interaction.module';\n"
if import_line not in text:
    anchor = "import { HealthModule } from './health/health.module';\n"
    if anchor not in text:
        raise SystemExit("Could not locate AppModule import anchor.")
    text = text.replace(anchor, anchor + import_line, 1)

if "    InteractionModule,\n" not in text:
    anchor = "    HealthModule,\n"
    if anchor not in text:
        raise SystemExit("Could not locate AppModule module-list anchor.")
    text = text.replace(anchor, anchor + "    InteractionModule,\n", 1)

path.write_text(text)
PY

cat > services/api/test/interaction.dto.test.ts <<'EOF'
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CommentQueryDto } from '../src/interaction/dto/comment-query.dto';
import { CreateCommentDto } from '../src/interaction/dto/create-comment.dto';
import { SetReactionDto } from '../src/interaction/dto/set-reaction.dto';

describe('Build 0009 interaction DTO validation', () => {
  it('accepts a valid comment', async () => {
    const dto = plainToInstance(CreateCommentDto, {
      content: 'Welcome to the neighbourhood.',
    });

    const errors = await validate(dto);

    assert.equal(errors.length, 0);
  });

  it('rejects an empty comment', async () => {
    const dto = plainToInstance(CreateCommentDto, {
      content: '',
    });

    const errors = await validate(dto);

    assert.ok(errors.length > 0);
  });

  it('accepts a supported reaction', async () => {
    const dto = plainToInstance(SetReactionDto, {
      type: 'SUPPORT',
    });

    const errors = await validate(dto);

    assert.equal(errors.length, 0);
  });

  it('normalises the comment feed limit from a query string', async () => {
    const dto = plainToInstance(CommentQueryDto, {
      limit: '25',
    });

    const errors = await validate(dto);

    assert.equal(errors.length, 0);
    assert.equal(dto.limit, 25);
  });
});
EOF

cat > docs/architecture/0009-comments-reactions.md <<'EOF'
# Build 0009 — Comments and Reactions

Build 0009 introduces the first interaction layer for Neighbour™ posts.

## Capabilities

- Create comments on visible posts
- Reply to an existing comment
- Retrieve comments with cursor pagination
- Edit comments as their author
- Soft-delete comments as their author
- Add or change one reaction per user per post
- Remove a reaction
- Retrieve reaction counts and the current viewer's reaction
- Enforce the existing post visibility rules before exposing interactions

## Reaction vocabulary

- `LIKE`
- `LOVE`
- `SUPPORT`
- `CELEBRATE`
- `INSIGHTFUL`

The reaction vocabulary is intentionally community-oriented and avoids negative
engagement mechanics in the initial platform release.

## API surface

```text
POST   /posts/:postId/comments
GET    /posts/:postId/comments
PATCH  /comments/:commentId
DELETE /comments/:commentId

PUT    /posts/:postId/reaction
DELETE /posts/:postId/reaction
GET    /posts/:postId/reactions
```

## Data model

`Comment` supports flat retrieval with an optional `parentId`, allowing clients
to construct threaded discussions without coupling the API to a specific visual
presentation.

`PostReaction` has a unique `(postId, userId)` constraint. A user can therefore
hold one current reaction per post, and changing reaction type is an idempotent
upsert operation.

## Integrity and permissions

- Interactions are available only when the requesting user can view the post.
- A reply must reference a live comment belonging to the same post.
- Only the comment author can edit or delete their comment.
- Deleted comments remain in storage for audit and moderation workflows but are
  excluded from the public interaction feed.
- Database cascades prevent orphaned comments and reactions when a post or user
  is permanently removed.
EOF

echo "Generating Prisma client..."
pnpm --filter @neighbour/api db:generate

echo "Applying Build 0009 migration..."
pnpm --filter @neighbour/api exec prisma migrate dev --name add_comments_and_reactions

echo "Formatting and validating Build 0009..."
pnpm format
pnpm check

echo
echo "Neighbour™ Build 0009 completed successfully."
echo
echo "Next commands:"
echo '  git status'
echo '  git add .'
echo '  git commit -m "build: establish comments and reactions"'
echo '  git push'
