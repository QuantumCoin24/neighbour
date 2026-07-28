#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${HOME}/Documents/neighbour"
cd "${ROOT_DIR}"

echo "Building Neighbour™ Build 0010 — Notification Foundation..."

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
    for index in range(start, len(source)):
        char = source[index]
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return start, index + 1

    raise SystemExit(f"Could not determine the end of {model_name} model.")

def insert_model_field(source: str, model_name: str, anchor: str, field: str):
    start, end = model_bounds(source, model_name)
    block = source[start:end]

    if field.strip() in block:
        return source

    lines = block.splitlines()
    for index, line in enumerate(lines):
        if line.strip().startswith(anchor):
            lines.insert(index + 1, field)
            replacement = "\n".join(lines)
            return source[:start] + replacement + source[end:]

    raise SystemExit(
        f"Could not locate anchor '{anchor}' in Prisma model '{model_name}'."
    )

if "enum NotificationType {" not in text:
    insertion_point = text.find("model User {")
    if insertion_point == -1:
        raise SystemExit("Could not locate Prisma enum insertion point.")

    notification_enum = """enum NotificationType {
  COMMENT
  REPLY
  REACTION
  CONNECTION_REQUEST
  CONNECTION_ACCEPTED
  COMMUNITY_INVITE
  COMMUNITY_ROLE_CHANGED
  SYSTEM
}

"""
    text = text[:insertion_point] + notification_enum + text[insertion_point:]

text = insert_model_field(
    text,
    "User",
    "postReactions",
    '  notificationsReceived Notification[]   @relation("NotificationRecipient")',
)
text = insert_model_field(
    text,
    "User",
    "notificationsReceived",
    '  notificationsActed    Notification[]   @relation("NotificationActor")',
)
text = insert_model_field(
    text,
    "Post",
    "reactions",
    "  notifications Notification[]",
)
text = insert_model_field(
    text,
    "Comment",
    "replies",
    "  notifications Notification[]",
)
text = insert_model_field(
    text,
    "Community",
    "posts",
    "  notifications Notification[]",
)

if "model Notification {" not in text:
    text = text.rstrip() + """

model Notification {
  id             String           @id @default(uuid()) @db.Uuid
  recipientId    String           @db.Uuid
  actorId        String?          @db.Uuid
  postId         String?          @db.Uuid
  commentId      String?          @db.Uuid
  communityId    String?          @db.Uuid
  type           NotificationType
  idempotencyKey String           @unique
  readAt         DateTime?
  dismissedAt    DateTime?
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt
  recipient      User             @relation("NotificationRecipient", fields: [recipientId], references: [id], onDelete: Cascade)
  actor          User?            @relation("NotificationActor", fields: [actorId], references: [id], onDelete: SetNull)
  post           Post?            @relation(fields: [postId], references: [id], onDelete: Cascade)
  comment        Comment?         @relation(fields: [commentId], references: [id], onDelete: Cascade)
  community      Community?       @relation(fields: [communityId], references: [id], onDelete: Cascade)

  @@index([recipientId, dismissedAt, createdAt])
  @@index([recipientId, readAt, createdAt])
  @@index([actorId, createdAt])
  @@index([postId])
  @@index([commentId])
  @@index([communityId])
  @@map("notifications")
}
"""

schema_path.write_text(text)
PY

mkdir -p \
  services/api/src/notification/dto \
  services/api/src/notification/interfaces \
  services/api/test \
  docs/architecture

cat > services/api/src/notification/dto/notification-query.dto.ts <<'EOF'
import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class NotificationQueryDto {
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 30;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  unreadOnly = false;
}
EOF

cat > services/api/src/notification/interfaces/notification-response.interface.ts <<'EOF'
import type { NotificationType } from '../../generated/prisma/client';

export interface NotificationActorResponse {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
}

export interface NotificationResponse {
  id: string;
  type: NotificationType;
  actor: NotificationActorResponse | null;
  postId: string | null;
  commentId: string | null;
  communityId: string | null;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationFeedResponse {
  items: NotificationResponse[];
  nextCursor: string | null;
  unreadCount: number;
}
EOF

cat > services/api/src/notification/notification.service.ts <<'EOF'
import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { NotificationType, Prisma } from '../generated/prisma/client';
import type { NotificationQueryDto } from './dto/notification-query.dto';
import type {
  NotificationFeedResponse,
  NotificationResponse,
} from './interfaces/notification-response.interface';

const notificationInclude = {
  actor: {
    include: {
      profile: true,
    },
  },
} satisfies Prisma.NotificationInclude;

type NotificationWithActor = Prisma.NotificationGetPayload<{
  include: typeof notificationInclude;
}>;

interface CommentNotificationInput {
  recipientId: string;
  actorId: string;
  postId: string;
  commentId: string;
  isReply: boolean;
}

interface ReactionNotificationInput {
  recipientId: string;
  actorId: string;
  postId: string;
}

@Injectable()
export class NotificationService {
  constructor(
    @Inject(DatabaseService)
    private readonly database: DatabaseService,
  ) {}

  async getInbox(
    recipientId: string,
    query: NotificationQueryDto,
  ): Promise<NotificationFeedResponse> {
    const where: Prisma.NotificationWhereInput = {
      recipientId,
      dismissedAt: null,
      ...(query.unreadOnly
        ? {
            readAt: null,
          }
        : {}),
    };

    const [notifications, unreadCount] = await Promise.all([
      this.database.notification.findMany({
        where,
        include: notificationInclude,
        orderBy: [
          {
            createdAt: 'desc',
          },
          {
            id: 'desc',
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
      }),
      this.database.notification.count({
        where: {
          recipientId,
          dismissedAt: null,
          readAt: null,
        },
      }),
    ]);

    const hasMore = notifications.length > query.limit;
    const items = hasMore
      ? notifications.slice(0, query.limit)
      : notifications;

    return {
      items: items.map((notification) =>
        this.toNotificationResponse(notification),
      ),
      nextCursor: hasMore ? items.at(-1)?.id ?? null : null,
      unreadCount,
    };
  }

  async getUnreadCount(recipientId: string): Promise<{ unreadCount: number }> {
    const unreadCount = await this.database.notification.count({
      where: {
        recipientId,
        dismissedAt: null,
        readAt: null,
      },
    });

    return {
      unreadCount,
    };
  }

  async markRead(
    recipientId: string,
    notificationId: string,
  ): Promise<NotificationResponse> {
    const existing = await this.requireOwnedNotification(
      recipientId,
      notificationId,
    );

    if (!existing.readAt) {
      await this.database.notification.update({
        where: {
          id: notificationId,
        },
        data: {
          readAt: new Date(),
        },
      });
    }

    return this.requireNotificationWithActor(notificationId);
  }

  async markAllRead(recipientId: string): Promise<{ updatedCount: number }> {
    const result = await this.database.notification.updateMany({
      where: {
        recipientId,
        dismissedAt: null,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return {
      updatedCount: result.count,
    };
  }

  async dismiss(
    recipientId: string,
    notificationId: string,
  ): Promise<void> {
    await this.requireOwnedNotification(recipientId, notificationId);

    await this.database.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        dismissedAt: new Date(),
      },
    });
  }

  async notifyComment(input: CommentNotificationInput): Promise<void> {
    if (input.recipientId === input.actorId) {
      return;
    }

    await this.database.notification.upsert({
      where: {
        idempotencyKey: `comment:${input.commentId}`,
      },
      create: {
        recipientId: input.recipientId,
        actorId: input.actorId,
        postId: input.postId,
        commentId: input.commentId,
        type: input.isReply
          ? NotificationType.REPLY
          : NotificationType.COMMENT,
        idempotencyKey: `comment:${input.commentId}`,
      },
      update: {
        dismissedAt: null,
      },
    });
  }

  async notifyReaction(input: ReactionNotificationInput): Promise<void> {
    if (input.recipientId === input.actorId) {
      return;
    }

    const idempotencyKey = `reaction:${input.postId}:${input.actorId}`;

    await this.database.notification.upsert({
      where: {
        idempotencyKey,
      },
      create: {
        recipientId: input.recipientId,
        actorId: input.actorId,
        postId: input.postId,
        type: NotificationType.REACTION,
        idempotencyKey,
      },
      update: {
        dismissedAt: null,
        readAt: null,
      },
    });
  }

  async removeReactionNotification(
    actorId: string,
    postId: string,
  ): Promise<void> {
    await this.database.notification.deleteMany({
      where: {
        idempotencyKey: `reaction:${postId}:${actorId}`,
      },
    });
  }

  private async requireOwnedNotification(
    recipientId: string,
    notificationId: string,
  ): Promise<{ id: string; readAt: Date | null }> {
    const notification = await this.database.notification.findFirst({
      where: {
        id: notificationId,
        recipientId,
        dismissedAt: null,
      },
      select: {
        id: true,
        readAt: true,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }

    return notification;
  }

  private async requireNotificationWithActor(
    notificationId: string,
  ): Promise<NotificationResponse> {
    const notification = await this.database.notification.findUnique({
      where: {
        id: notificationId,
      },
      include: notificationInclude,
    });

    if (!notification || notification.dismissedAt) {
      throw new NotFoundException('Notification not found.');
    }

    return this.toNotificationResponse(notification);
  }

  private toNotificationResponse(
    notification: NotificationWithActor,
  ): NotificationResponse {
    return {
      id: notification.id,
      type: notification.type,
      actor: notification.actor
        ? {
            id: notification.actor.id,
            displayName: notification.actor.displayName,
            username: notification.actor.profile?.username ?? null,
            avatarUrl: notification.actor.profile?.avatarUrl ?? null,
          }
        : null,
      postId: notification.postId,
      commentId: notification.commentId,
      communityId: notification.communityId,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }
}
EOF

cat > services/api/src/notification/notification.controller.ts <<'EOF'
import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { NotificationQueryDto } from './dto/notification-query.dto';
import type {
  NotificationFeedResponse,
  NotificationResponse,
} from './interfaces/notification-response.interface';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
  ) {}

  @Get()
  getInbox(
    @CurrentUser() user: AuthUser,
    @Query() query: NotificationQueryDto,
  ): Promise<NotificationFeedResponse> {
    return this.notificationService.getInbox(user.id, query);
  }

  @Get('unread-count')
  getUnreadCount(
    @CurrentUser() user: AuthUser,
  ): Promise<{ unreadCount: number }> {
    return this.notificationService.getUnreadCount(user.id);
  }

  @Patch('read-all')
  markAllRead(
    @CurrentUser() user: AuthUser,
  ): Promise<{ updatedCount: number }> {
    return this.notificationService.markAllRead(user.id);
  }

  @Patch(':notificationId/read')
  markRead(
    @CurrentUser() user: AuthUser,
    @Param('notificationId') notificationId: string,
  ): Promise<NotificationResponse> {
    return this.notificationService.markRead(user.id, notificationId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':notificationId')
  dismiss(
    @CurrentUser() user: AuthUser,
    @Param('notificationId') notificationId: string,
  ): Promise<void> {
    return this.notificationService.dismiss(user.id, notificationId);
  }
}
EOF

cat > services/api/src/notification/notification.module.ts <<'EOF'
import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

@Module({
  imports: [DatabaseModule],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
EOF

python3 - <<'PY'
from pathlib import Path

path = Path("services/api/src/app.module.ts")
text = path.read_text()

import_line = "import { NotificationModule } from './notification/notification.module';\n"
if import_line not in text:
    anchor = "import { HealthModule } from './health/health.module';\n"
    if anchor not in text:
        raise SystemExit("Could not locate AppModule import anchor.")
    text = text.replace(anchor, anchor + import_line, 1)

if "    NotificationModule,\n" not in text:
    anchor = "    HealthModule,\n"
    if anchor not in text:
        raise SystemExit("Could not locate AppModule module-list anchor.")
    text = text.replace(anchor, anchor + "    NotificationModule,\n", 1)

path.write_text(text)
PY

python3 - <<'PY'
from pathlib import Path

module_path = Path("services/api/src/interaction/interaction.module.ts")
module_text = module_path.read_text()

notification_import = (
    "import { NotificationModule } from '../notification/notification.module';\n"
)
if notification_import not in module_text:
    anchor = "import { DatabaseModule } from '../database/database.module';\n"
    if anchor not in module_text:
        raise SystemExit("Could not locate InteractionModule import anchor.")
    module_text = module_text.replace(
        anchor,
        anchor + notification_import,
        1,
    )

module_text = module_text.replace(
    "imports: [DatabaseModule, PostModule],",
    "imports: [DatabaseModule, NotificationModule, PostModule],",
)

module_path.write_text(module_text)

service_path = Path("services/api/src/interaction/interaction.service.ts")
service_text = service_path.read_text()

notification_service_import = (
    "import { NotificationService } from '../notification/notification.service';\n"
)
if notification_service_import not in service_text:
    anchor = "import { PostService } from '../post/post.service';\n"
    if anchor not in service_text:
        raise SystemExit("Could not locate InteractionService import anchor.")
    service_text = service_text.replace(
        anchor,
        notification_service_import + anchor,
        1,
    )

constructor_anchor = """    private readonly database: DatabaseService,
    private readonly postService: PostService,
"""
constructor_replacement = """    private readonly database: DatabaseService,
    private readonly notificationService: NotificationService,
    private readonly postService: PostService,
"""
if "private readonly notificationService" not in service_text:
    if constructor_anchor not in service_text:
        raise SystemExit("Could not locate InteractionService constructor anchor.")
    service_text = service_text.replace(
        constructor_anchor,
        constructor_replacement,
        1,
    )

service_text = service_text.replace(
    "    await this.postService.findOne(currentUserId, postId);\n\n    if (dto.parentId) {",
    "    const post = await this.postService.findOne(currentUserId, postId);\n\n    if (dto.parentId) {",
    1,
)

comment_return = "    return this.requireCommentWithAuthor(created.id);\n"
comment_notification = """    await this.notificationService.notifyComment({
      recipientId: post.author.id,
      actorId: currentUserId,
      postId,
      commentId: created.id,
      isReply: dto.parentId !== undefined,
    });

    return this.requireCommentWithAuthor(created.id);
"""
if "notificationService.notifyComment" not in service_text:
    if comment_return not in service_text:
        raise SystemExit("Could not locate comment return anchor.")
    service_text = service_text.replace(
        comment_return,
        comment_notification,
        1,
    )

reaction_find = """    await this.postService.findOne(currentUserId, postId);

    const reaction = await this.database.postReaction.upsert({
"""
reaction_replace = """    const post = await this.postService.findOne(currentUserId, postId);

    const reaction = await this.database.postReaction.upsert({
"""
if "notificationService.notifyReaction" not in service_text:
    if reaction_find not in service_text:
        raise SystemExit("Could not locate reaction visibility anchor.")
    service_text = service_text.replace(
        reaction_find,
        reaction_replace,
        1,
    )

reaction_return = """    return {
      postId: reaction.postId,
      type: reaction.type,
      createdAt: reaction.createdAt,
      updatedAt: reaction.updatedAt,
    };
"""
reaction_replacement = """    await this.notificationService.notifyReaction({
      recipientId: post.author.id,
      actorId: currentUserId,
      postId,
    });

    return {
      postId: reaction.postId,
      type: reaction.type,
      createdAt: reaction.createdAt,
      updatedAt: reaction.updatedAt,
    };
"""
if "notificationService.notifyReaction" not in service_text:
    if reaction_return not in service_text:
        raise SystemExit("Could not locate reaction response anchor.")
    service_text = service_text.replace(
        reaction_return,
        reaction_replacement,
        1,
    )

remove_anchor = """    await this.database.postReaction.deleteMany({
      where: {
        postId,
        userId: currentUserId,
      },
    });
"""
remove_replacement = """    await this.database.postReaction.deleteMany({
      where: {
        postId,
        userId: currentUserId,
      },
    });

    await this.notificationService.removeReactionNotification(
      currentUserId,
      postId,
    );
"""
if "removeReactionNotification" not in service_text:
    if remove_anchor not in service_text:
        raise SystemExit("Could not locate reaction removal anchor.")
    service_text = service_text.replace(
        remove_anchor,
        remove_replacement,
        1,
    )

service_path.write_text(service_text)
PY

cat > services/api/test/notification.dto.test.ts <<'EOF'
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { NotificationQueryDto } from '../src/notification/dto/notification-query.dto';

describe('Build 0010 notification DTO validation', () => {
  it('uses the default notification inbox options', async () => {
    const dto = plainToInstance(NotificationQueryDto, {});

    const errors = await validate(dto);

    assert.equal(errors.length, 0);
    assert.equal(dto.limit, 30);
    assert.equal(dto.unreadOnly, false);
  });

  it('normalises query-string values', async () => {
    const dto = plainToInstance(NotificationQueryDto, {
      limit: '25',
      unreadOnly: 'true',
    });

    const errors = await validate(dto);

    assert.equal(errors.length, 0);
    assert.equal(dto.limit, 25);
    assert.equal(dto.unreadOnly, true);
  });

  it('rejects an excessive inbox page size', async () => {
    const dto = plainToInstance(NotificationQueryDto, {
      limit: '101',
    });

    const errors = await validate(dto);

    assert.ok(errors.length > 0);
  });
});
EOF

cat > docs/architecture/0010-notification-foundation.md <<'EOF'
# Build 0010 — Notification Foundation

Build 0010 establishes the shared in-app notification engine for Neighbour™.

## Capabilities

- Persistent notification inbox
- Cursor pagination
- Optional unread-only filtering
- Unread counter
- Mark one notification as read
- Mark all notifications as read
- Dismiss notifications without immediately deleting their audit record
- Idempotent notification creation
- Automatic comment and reaction notifications
- Automatic removal of reaction notifications when a reaction is withdrawn

## API surface

```text
GET    /notifications
GET    /notifications/unread-count
PATCH  /notifications/read-all
PATCH  /notifications/:notificationId/read
DELETE /notifications/:notificationId
```

## Initial event vocabulary

```text
COMMENT
REPLY
REACTION
CONNECTION_REQUEST
CONNECTION_ACCEPTED
COMMUNITY_INVITE
COMMUNITY_ROLE_CHANGED
SYSTEM
```

Only comment, reply, and reaction events are emitted in Build 0010. The remaining
types reserve a stable contract for later social graph, community administration,
and platform operations integrations.

## Delivery model

Build 0010 provides the canonical in-app inbox. Push delivery, email delivery,
and user notification preferences will attach to this same notification record
in later builds rather than creating parallel notification systems.

## Idempotency

Every notification has a unique `idempotencyKey`.

- Comment notifications use the comment identifier.
- Reaction notifications use the post and actor identifiers.
- Changing a reaction refreshes the existing notification.
- Removing a reaction removes its corresponding notification.

## Privacy and permissions

- Inbox records are scoped to the authenticated recipient.
- Read and dismissal operations require recipient ownership.
- Self-generated comment and reaction notifications are suppressed.
- Notification actors are nullable so an account can later be removed while
  retaining an operational or audit notification record.
EOF

echo "Generating Prisma client..."
pnpm --filter @neighbour/api db:generate

echo "Applying Build 0010 migration..."
pnpm --filter @neighbour/api exec prisma migrate dev --name add_notification_foundation

echo "Formatting and validating Build 0010..."
pnpm format
pnpm check

echo
echo "Neighbour™ Build 0010 completed successfully."
echo
echo "Next commands:"
echo "  git status"
echo "  git add ."
echo '  git commit -m "build: establish notification foundation"'
echo "  git push"
