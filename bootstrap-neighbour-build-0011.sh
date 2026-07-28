#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "Building Neighbour™ Build 0011 — Direct Messaging Engine..."

SCHEMA="services/api/prisma/schema.prisma"
APP_MODULE="services/api/src/app.module.ts"

for required in "$SCHEMA" "$APP_MODULE"; do
  [[ -f "$required" ]] || { echo "Required file not found: $required"; exit 1; }
done

if grep -q 'model Conversation {' "$SCHEMA"; then
  echo "Build 0011 appears to already be installed. Refusing to apply it twice."
  exit 1
fi

python3 - <<'PY'
from pathlib import Path
p=Path("services/api/prisma/schema.prisma")
s=p.read_text()
def r(a,b,n):
    global s
    if a not in s: raise SystemExit(f"Missing Prisma insertion point: {n}")
    s=s.replace(a,b,1)

r("""enum NotificationType {
  COMMENT
  REPLY
  REACTION
  CONNECTION_REQUEST
  CONNECTION_ACCEPTED
  COMMUNITY_INVITE
  COMMUNITY_ROLE_CHANGED
  SYSTEM
}""","""enum NotificationType {
  COMMENT
  REPLY
  REACTION
  MESSAGE
  CONNECTION_REQUEST
  CONNECTION_ACCEPTED
  COMMUNITY_INVITE
  COMMUNITY_ROLE_CHANGED
  SYSTEM
}

enum ConversationType {
  DIRECT
  GROUP
  COMMUNITY
  BUSINESS
  ORGANISATION
  SUPPORT
}

enum ConversationMemberRole {
  OWNER
  ADMIN
  MEMBER
}

enum MessageType {
  TEXT
  IMAGE
  VIDEO
  FILE
  SYSTEM
}""","enums")

r("""  notificationsActed    Notification[]   @relation("NotificationActor")
  createdAt            DateTime       @default(now())""","""  notificationsActed    Notification[]   @relation("NotificationActor")
  conversationsOwned   Conversation[] @relation("ConversationOwner")
  conversationMembers  ConversationMember[]
  messagesSent         Message[]      @relation("MessageSender")
  messageReadReceipts  MessageReadReceipt[]
  createdAt            DateTime       @default(now())""","User relations")

r("""  notifications Notification[]
  createdAt   DateTime            @default(now())""","""  notifications Notification[]
  conversations Conversation[]
  createdAt   DateTime            @default(now())""","Community relation")

r("model Notification {", """model Conversation {
  id            String           @id @default(uuid()) @db.Uuid
  type          ConversationType
  title         String?
  ownerId       String           @db.Uuid
  communityId   String?          @db.Uuid
  directKey     String?          @unique
  lastMessageId String?          @unique @db.Uuid
  lastMessageAt DateTime?
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt
  owner         User             @relation("ConversationOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  community     Community?       @relation(fields: [communityId], references: [id], onDelete: Cascade)
  members       ConversationMember[]
  messages      Message[]        @relation("ConversationMessages")
  lastMessage   Message?         @relation("ConversationLastMessage", fields: [lastMessageId], references: [id], onDelete: SetNull)
  notifications Notification[]

  @@index([ownerId, updatedAt])
  @@index([communityId, updatedAt])
  @@index([type, updatedAt])
  @@index([lastMessageAt])
  @@map("conversations")
}

model ConversationMember {
  id                String                 @id @default(uuid()) @db.Uuid
  conversationId    String                 @db.Uuid
  userId            String                 @db.Uuid
  role              ConversationMemberRole @default(MEMBER)
  joinedAt          DateTime               @default(now())
  leftAt            DateTime?
  archivedAt        DateTime?
  mutedUntil        DateTime?
  pinnedAt          DateTime?
  lastReadMessageId String?                @db.Uuid
  lastReadAt        DateTime?
  unreadCount       Int                    @default(0)
  createdAt         DateTime               @default(now())
  updatedAt         DateTime               @updatedAt
  conversation      Conversation           @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  user              User                   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([conversationId, userId])
  @@index([userId, archivedAt, updatedAt])
  @@index([conversationId, leftAt])
  @@map("conversation_members")
}

model Message {
  id              String              @id @default(uuid()) @db.Uuid
  conversationId  String              @db.Uuid
  senderId        String              @db.Uuid
  parentMessageId String?             @db.Uuid
  type            MessageType         @default(TEXT)
  content         String?
  clientNonce     String?
  metadata        Json?
  editedAt        DateTime?
  deletedAt       DateTime?
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
  conversation    Conversation        @relation("ConversationMessages", fields: [conversationId], references: [id], onDelete: Cascade)
  lastForConversation Conversation?    @relation("ConversationLastMessage")
  sender          User                @relation("MessageSender", fields: [senderId], references: [id], onDelete: Cascade)
  parentMessage   Message?            @relation("MessageReplies", fields: [parentMessageId], references: [id], onDelete: SetNull)
  replies         Message[]           @relation("MessageReplies")
  attachments     MessageAttachment[]
  readReceipts    MessageReadReceipt[]
  notifications   Notification[]

  @@unique([conversationId, senderId, clientNonce])
  @@index([conversationId, createdAt])
  @@index([senderId, createdAt])
  @@index([parentMessageId])
  @@index([deletedAt])
  @@map("messages")
}

model MessageAttachment {
  id         String   @id @default(uuid()) @db.Uuid
  messageId  String   @db.Uuid
  storageKey String
  fileName   String
  mimeType   String
  sizeBytes  Int
  width      Int?
  height     Int?
  durationMs Int?
  createdAt  DateTime @default(now())
  message    Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)

  @@index([messageId])
  @@index([storageKey])
  @@map("message_attachments")
}

model MessageReadReceipt {
  id        String   @id @default(uuid()) @db.Uuid
  messageId String   @db.Uuid
  userId    String   @db.Uuid
  readAt    DateTime @default(now())
  message   Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([messageId, userId])
  @@index([userId, readAt])
  @@index([messageId, readAt])
  @@map("message_read_receipts")
}

model Notification {""","models")

r("""  communityId    String?          @db.Uuid
  type           NotificationType""","""  communityId    String?          @db.Uuid
  conversationId String?          @db.Uuid
  messageId      String?          @db.Uuid
  type           NotificationType""","notification fields")

r("""  community      Community?       @relation(fields: [communityId], references: [id], onDelete: Cascade)

  @@index([recipientId, dismissedAt, createdAt])""","""  community      Community?       @relation(fields: [communityId], references: [id], onDelete: Cascade)
  conversation   Conversation?    @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  message        Message?         @relation(fields: [messageId], references: [id], onDelete: Cascade)

  @@index([recipientId, dismissedAt, createdAt])""","notification relations")

r("""  @@index([communityId])
  @@map("notifications")""","""  @@index([communityId])
  @@index([conversationId])
  @@index([messageId])
  @@map("notifications")""","notification indexes")
p.write_text(s)
PY

mkdir -p services/api/src/message/dto services/api/src/message/interfaces services/api/test docs/architecture

cat > services/api/src/message/dto/create-conversation.dto.ts <<'EOF'
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ConversationType } from '../../generated/prisma/client';

export class CreateConversationDto {
  @IsEnum(ConversationType) type!: ConversationType;
  @IsOptional() @IsString() @MaxLength(120) title?: string;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(250) @ArrayUnique() @IsUUID('4', { each: true })
  memberIds!: string[];
  @IsOptional() @IsUUID('4') communityId?: string;
}
EOF

cat > services/api/src/message/dto/create-message.dto.ts <<'EOF'
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsEnum, IsInt, IsObject, IsOptional, IsString, IsUUID, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { MessageType } from '../../generated/prisma/client';

export class CreateMessageAttachmentDto {
  @IsString() @MaxLength(512) storageKey!: string;
  @IsString() @MaxLength(255) fileName!: string;
  @IsString() @MaxLength(127) mimeType!: string;
  @IsInt() @Min(1) @Max(2_147_483_647) sizeBytes!: number;
  @IsOptional() @IsInt() @Min(1) width?: number;
  @IsOptional() @IsInt() @Min(1) height?: number;
  @IsOptional() @IsInt() @Min(0) durationMs?: number;
}

export class CreateMessageDto {
  @IsOptional() @IsEnum(MessageType) type: MessageType = MessageType.TEXT;
  @IsOptional() @IsString() @MaxLength(10_000) content?: string;
  @IsOptional() @IsUUID('4') parentMessageId?: string;
  @IsOptional() @IsString() @MaxLength(128) clientNonce?: string;
  @IsOptional() @IsObject() metadata?: Record<string, unknown>;
  @IsOptional() @IsArray() @ArrayMaxSize(10) @ValidateNested({ each: true }) @Type(() => CreateMessageAttachmentDto)
  attachments?: CreateMessageAttachmentDto[];
}
EOF

cat > services/api/src/message/dto/update-message.dto.ts <<'EOF'
import { IsString, MaxLength } from 'class-validator';
export class UpdateMessageDto {
  @IsString() @MaxLength(10_000) content!: string;
}
EOF

cat > services/api/src/message/dto/conversation-query.dto.ts <<'EOF'
import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
export class ConversationQueryDto {
  @IsOptional() @IsUUID('4') cursor?: string;
  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1) @Max(100) limit = 30;
  @IsOptional() @Transform(({ value }) => value === true || value === 'true') @IsBoolean() archived = false;
}
EOF

cat > services/api/src/message/dto/message-query.dto.ts <<'EOF'
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
export class MessageQueryDto {
  @IsOptional() @IsUUID('4') cursor?: string;
  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1) @Max(100) limit = 50;
}
EOF

cat > services/api/src/message/dto/update-conversation-state.dto.ts <<'EOF'
import { IsBoolean, IsDateString, IsOptional } from 'class-validator';
export class UpdateConversationStateDto {
  @IsOptional() @IsBoolean() archived?: boolean;
  @IsOptional() @IsBoolean() pinned?: boolean;
  @IsOptional() @IsDateString() mutedUntil?: string;
}
EOF

cat > services/api/src/message/interfaces/message-response.interface.ts <<'EOF'
import type { ConversationMemberRole, ConversationType, MessageType } from '../../generated/prisma/client';

export interface MessageActorResponse {
  id: string; displayName: string; username: string | null; avatarUrl: string | null;
}
export interface MessageAttachmentResponse {
  id: string; storageKey: string; fileName: string; mimeType: string; sizeBytes: number;
  width: number | null; height: number | null; durationMs: number | null;
}
export interface MessageResponse {
  id: string; conversationId: string; sender: MessageActorResponse; parentMessageId: string | null;
  type: MessageType; content: string | null; metadata: unknown; attachments: MessageAttachmentResponse[];
  editedAt: Date | null; deletedAt: Date | null; createdAt: Date; updatedAt: Date;
}
export interface ConversationMemberResponse {
  user: MessageActorResponse; role: ConversationMemberRole; joinedAt: Date; mutedUntil: Date | null;
  pinnedAt: Date | null; archivedAt: Date | null; unreadCount: number; lastReadAt: Date | null;
}
export interface ConversationResponse {
  id: string; type: ConversationType; title: string | null; communityId: string | null; ownerId: string;
  members: ConversationMemberResponse[]; lastMessage: MessageResponse | null; lastMessageAt: Date | null;
  createdAt: Date; updatedAt: Date;
}
export interface ConversationFeedResponse { items: ConversationResponse[]; nextCursor: string | null; }
export interface MessageFeedResponse { items: MessageResponse[]; nextCursor: string | null; }
EOF

cat > services/api/src/message/message.service.ts <<'EOF'
import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ConversationMemberRole, ConversationType, MessageType, NotificationType, Prisma, UserStatus } from '../generated/prisma/client';
import type { ConversationQueryDto } from './dto/conversation-query.dto';
import type { CreateConversationDto } from './dto/create-conversation.dto';
import type { CreateMessageDto } from './dto/create-message.dto';
import type { MessageQueryDto } from './dto/message-query.dto';
import type { UpdateConversationStateDto } from './dto/update-conversation-state.dto';
import type { UpdateMessageDto } from './dto/update-message.dto';
import type { ConversationFeedResponse, ConversationResponse, MessageFeedResponse, MessageResponse } from './interfaces/message-response.interface';

const actorSelect = { id: true, displayName: true, profile: { select: { username: true, avatarUrl: true } } } satisfies Prisma.UserSelect;
const messageInclude = { sender: { select: actorSelect }, attachments: { orderBy: { createdAt: 'asc' } } } satisfies Prisma.MessageInclude;
const conversationInclude = {
  members: { where: { leftAt: null }, include: { user: { select: actorSelect } }, orderBy: { joinedAt: 'asc' } },
  lastMessage: { include: messageInclude },
} satisfies Prisma.ConversationInclude;
type MessageWithRelations = Prisma.MessageGetPayload<{ include: typeof messageInclude }>;
type ConversationWithRelations = Prisma.ConversationGetPayload<{ include: typeof conversationInclude }>;

@Injectable()
export class MessageService {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async createConversation(userId: string, dto: CreateConversationDto): Promise<ConversationResponse> {
    const memberIds = [...new Set([userId, ...dto.memberIds])];
    if (dto.type === ConversationType.DIRECT && memberIds.length !== 2)
      throw new BadRequestException('A direct conversation must contain exactly two members.');
    if (dto.type !== ConversationType.DIRECT && memberIds.length < 2)
      throw new BadRequestException('A conversation must contain at least two members.');

    const users = await this.database.user.findMany({
      where: { id: { in: memberIds }, status: UserStatus.ACTIVE }, select: { id: true },
    });
    if (users.length !== memberIds.length)
      throw new BadRequestException('One or more conversation members are unavailable.');

    const directKey = dto.type === ConversationType.DIRECT ? [...memberIds].sort().join(':') : null;
    if (directKey) {
      const existing = await this.database.conversation.findUnique({ where: { directKey }, include: conversationInclude });
      if (existing) {
        await this.database.conversationMember.updateMany({
          where: { conversationId: existing.id, userId },
          data: { leftAt: null, archivedAt: null },
        });
        return this.requireConversation(userId, existing.id);
      }
    }

    const conversation = await this.database.conversation.create({
      data: {
        type: dto.type, title: dto.title?.trim() || null, ownerId: userId,
        communityId: dto.communityId, directKey,
        members: { create: memberIds.map((id) => ({
          userId: id, role: id === userId ? ConversationMemberRole.OWNER : ConversationMemberRole.MEMBER,
        })) },
      },
      include: conversationInclude,
    });
    return this.toConversationResponse(conversation);
  }

  async listConversations(userId: string, query: ConversationQueryDto): Promise<ConversationFeedResponse> {
    const rows = await this.database.conversation.findMany({
      where: { members: { some: { userId, leftAt: null, archivedAt: query.archived ? { not: null } : null } } },
      include: conversationInclude,
      orderBy: [{ lastMessageAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length > query.limit;
    const items = hasMore ? rows.slice(0, query.limit) : rows;
    return { items: items.map((x) => this.toConversationResponse(x)), nextCursor: hasMore ? items.at(-1)?.id ?? null : null };
  }

  async getConversation(userId: string, conversationId: string): Promise<ConversationResponse> {
    return this.requireConversation(userId, conversationId);
  }

  async listMessages(userId: string, conversationId: string, query: MessageQueryDto): Promise<MessageFeedResponse> {
    await this.requireMembership(userId, conversationId);
    const rows = await this.database.message.findMany({
      where: { conversationId }, include: messageInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length > query.limit;
    const items = hasMore ? rows.slice(0, query.limit) : rows;
    return { items: items.map((x) => this.toMessageResponse(x)), nextCursor: hasMore ? items.at(-1)?.id ?? null : null };
  }

  async sendMessage(userId: string, conversationId: string, dto: CreateMessageDto): Promise<MessageResponse> {
    await this.requireMembership(userId, conversationId);
    const content = dto.content?.trim() || null;
    const attachments = dto.attachments ?? [];
    if (!content && attachments.length === 0 && dto.type !== MessageType.SYSTEM)
      throw new BadRequestException('A message requires content or an attachment.');

    if (dto.parentMessageId) {
      const parent = await this.database.message.findFirst({ where: { id: dto.parentMessageId, conversationId }, select: { id: true } });
      if (!parent) throw new BadRequestException('The reply target does not belong to this conversation.');
    }

    if (dto.clientNonce) {
      const existing = await this.database.message.findFirst({
        where: { conversationId, senderId: userId, clientNonce: dto.clientNonce }, include: messageInclude,
      });
      if (existing) return this.toMessageResponse(existing);
    }

    const message = await this.database.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          conversationId, senderId: userId, parentMessageId: dto.parentMessageId,
          type: dto.type, content, clientNonce: dto.clientNonce,
          metadata: dto.metadata as Prisma.InputJsonValue | undefined,
          attachments: attachments.length ? { create: attachments } : undefined,
        },
        include: messageInclude,
      });
      await tx.conversation.update({ where: { id: conversationId }, data: { lastMessageId: created.id, lastMessageAt: created.createdAt } });
      await tx.conversationMember.updateMany({
        where: { conversationId, leftAt: null, userId: { not: userId } },
        data: { unreadCount: { increment: 1 } },
      });
      await tx.conversationMember.update({
        where: { conversationId_userId: { conversationId, userId } },
        data: { lastReadMessageId: created.id, lastReadAt: created.createdAt, unreadCount: 0 },
      });
      const recipients = await tx.conversationMember.findMany({
        where: {
          conversationId, leftAt: null, userId: { not: userId },
          OR: [{ mutedUntil: null }, { mutedUntil: { lt: new Date() } }],
        },
        select: { userId: true },
      });
      if (recipients.length) await tx.notification.createMany({
        data: recipients.map((x) => ({
          recipientId: x.userId, actorId: userId, conversationId, messageId: created.id,
          type: NotificationType.MESSAGE, idempotencyKey: `message:${created.id}:${x.userId}`,
        })),
        skipDuplicates: true,
      });
      return created;
    });
    return this.toMessageResponse(message);
  }

  async editMessage(userId: string, messageId: string, dto: UpdateMessageDto): Promise<MessageResponse> {
    const message = await this.requireOwnedMessage(userId, messageId);
    if (message.deletedAt) throw new ConflictException('A deleted message cannot be edited.');
    const updated = await this.database.message.update({
      where: { id: messageId }, data: { content: dto.content.trim(), editedAt: new Date() }, include: messageInclude,
    });
    return this.toMessageResponse(updated);
  }

  async deleteMessage(userId: string, messageId: string): Promise<void> {
    const message = await this.requireOwnedMessage(userId, messageId);
    if (message.deletedAt) return;
    await this.database.$transaction([
      this.database.message.update({ where: { id: messageId }, data: { content: null, metadata: Prisma.JsonNull, deletedAt: new Date() } }),
      this.database.messageAttachment.deleteMany({ where: { messageId } }),
      this.database.notification.deleteMany({ where: { messageId } }),
    ]);
  }

  async markRead(userId: string, conversationId: string, messageId?: string): Promise<{ unreadCount: number; lastReadAt: Date }> {
    await this.requireMembership(userId, conversationId);
    const target = messageId
      ? await this.database.message.findFirst({ where: { id: messageId, conversationId }, select: { id: true, createdAt: true } })
      : await this.database.message.findFirst({ where: { conversationId }, orderBy: { createdAt: 'desc' }, select: { id: true, createdAt: true } });
    if (messageId && !target) throw new BadRequestException('Read target does not belong to this conversation.');
    const readAt = target?.createdAt ?? new Date();
    await this.database.$transaction(async (tx) => {
      await tx.conversationMember.update({
        where: { conversationId_userId: { conversationId, userId } },
        data: { unreadCount: 0, lastReadMessageId: target?.id ?? null, lastReadAt: readAt },
      });
      if (target) await tx.messageReadReceipt.upsert({
        where: { messageId_userId: { messageId: target.id, userId } },
        create: { messageId: target.id, userId, readAt }, update: { readAt },
      });
      await tx.notification.updateMany({
        where: { recipientId: userId, conversationId, type: NotificationType.MESSAGE, readAt: null },
        data: { readAt: new Date() },
      });
    });
    return { unreadCount: 0, lastReadAt: readAt };
  }

  async updateState(userId: string, conversationId: string, dto: UpdateConversationStateDto): Promise<ConversationResponse> {
    await this.requireMembership(userId, conversationId);
    const data: Prisma.ConversationMemberUpdateInput = {};
    if (dto.archived !== undefined) data.archivedAt = dto.archived ? new Date() : null;
    if (dto.pinned !== undefined) data.pinnedAt = dto.pinned ? new Date() : null;
    if (dto.mutedUntil !== undefined) data.mutedUntil = new Date(dto.mutedUntil);
    await this.database.conversationMember.update({ where: { conversationId_userId: { conversationId, userId } }, data });
    return this.requireConversation(userId, conversationId);
  }

  private async requireMembership(userId: string, conversationId: string): Promise<void> {
    const found = await this.database.conversationMember.findFirst({
      where: { conversationId, userId, leftAt: null }, select: { id: true },
    });
    if (!found) throw new NotFoundException('Conversation not found.');
  }

  private async requireConversation(userId: string, conversationId: string): Promise<ConversationResponse> {
    await this.requireMembership(userId, conversationId);
    const row = await this.database.conversation.findUnique({ where: { id: conversationId }, include: conversationInclude });
    if (!row) throw new NotFoundException('Conversation not found.');
    return this.toConversationResponse(row);
  }

  private async requireOwnedMessage(userId: string, messageId: string): Promise<{ deletedAt: Date | null }> {
    const row = await this.database.message.findUnique({ where: { id: messageId }, select: { senderId: true, deletedAt: true } });
    if (!row) throw new NotFoundException('Message not found.');
    if (row.senderId !== userId) throw new ForbiddenException('Only the sender may modify this message.');
    return row;
  }

  private toConversationResponse(x: ConversationWithRelations): ConversationResponse {
    return {
      id: x.id, type: x.type, title: x.title, communityId: x.communityId, ownerId: x.ownerId,
      members: x.members.map((m) => ({
        user: { id: m.user.id, displayName: m.user.displayName, username: m.user.profile?.username ?? null, avatarUrl: m.user.profile?.avatarUrl ?? null },
        role: m.role, joinedAt: m.joinedAt, mutedUntil: m.mutedUntil, pinnedAt: m.pinnedAt,
        archivedAt: m.archivedAt, unreadCount: m.unreadCount, lastReadAt: m.lastReadAt,
      })),
      lastMessage: x.lastMessage ? this.toMessageResponse(x.lastMessage) : null,
      lastMessageAt: x.lastMessageAt, createdAt: x.createdAt, updatedAt: x.updatedAt,
    };
  }

  private toMessageResponse(x: MessageWithRelations): MessageResponse {
    return {
      id: x.id, conversationId: x.conversationId,
      sender: { id: x.sender.id, displayName: x.sender.displayName, username: x.sender.profile?.username ?? null, avatarUrl: x.sender.profile?.avatarUrl ?? null },
      parentMessageId: x.parentMessageId, type: x.type, content: x.deletedAt ? null : x.content,
      metadata: x.deletedAt ? null : x.metadata,
      attachments: x.deletedAt ? [] : x.attachments.map((a) => ({
        id: a.id, storageKey: a.storageKey, fileName: a.fileName, mimeType: a.mimeType, sizeBytes: a.sizeBytes,
        width: a.width, height: a.height, durationMs: a.durationMs,
      })),
      editedAt: x.editedAt, deletedAt: x.deletedAt, createdAt: x.createdAt, updatedAt: x.updatedAt,
    };
  }
}
EOF

cat > services/api/src/message/message.controller.ts <<'EOF'
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { ConversationQueryDto } from './dto/conversation-query.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageQueryDto } from './dto/message-query.dto';
import { UpdateConversationStateDto } from './dto/update-conversation-state.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import type { ConversationFeedResponse, ConversationResponse, MessageFeedResponse, MessageResponse } from './interfaces/message-response.interface';
import { MessageService } from './message.service';

@Controller('messages')
export class MessageController {
  constructor(private readonly service: MessageService) {}

  @Post('conversations')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateConversationDto): Promise<ConversationResponse> {
    return this.service.createConversation(user.id, dto);
  }

  @Get('conversations')
  list(@CurrentUser() user: AuthUser, @Query() query: ConversationQueryDto): Promise<ConversationFeedResponse> {
    return this.service.listConversations(user.id, query);
  }

  @Get('conversations/:conversationId')
  get(@CurrentUser() user: AuthUser, @Param('conversationId') id: string): Promise<ConversationResponse> {
    return this.service.getConversation(user.id, id);
  }

  @Patch('conversations/:conversationId')
  state(@CurrentUser() user: AuthUser, @Param('conversationId') id: string, @Body() dto: UpdateConversationStateDto): Promise<ConversationResponse> {
    return this.service.updateState(user.id, id, dto);
  }

  @Post('conversations/:conversationId/messages')
  send(@CurrentUser() user: AuthUser, @Param('conversationId') id: string, @Body() dto: CreateMessageDto): Promise<MessageResponse> {
    return this.service.sendMessage(user.id, id, dto);
  }

  @Get('conversations/:conversationId/messages')
  messages(@CurrentUser() user: AuthUser, @Param('conversationId') id: string, @Query() query: MessageQueryDto): Promise<MessageFeedResponse> {
    return this.service.listMessages(user.id, id, query);
  }

  @Post('conversations/:conversationId/read')
  read(@CurrentUser() user: AuthUser, @Param('conversationId') id: string, @Body() body: { messageId?: string }): Promise<{ unreadCount: number; lastReadAt: Date }> {
    return this.service.markRead(user.id, id, body.messageId);
  }

  @Patch(':messageId')
  edit(@CurrentUser() user: AuthUser, @Param('messageId') id: string, @Body() dto: UpdateMessageDto): Promise<MessageResponse> {
    return this.service.editMessage(user.id, id, dto);
  }

  @Delete(':messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param('messageId') id: string): Promise<void> {
    return this.service.deleteMessage(user.id, id);
  }
}
EOF

cat > services/api/src/message/message.module.ts <<'EOF'
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';

@Module({
  imports: [DatabaseModule],
  controllers: [MessageController],
  providers: [MessageService],
  exports: [MessageService],
})
export class MessageModule {}
EOF

python3 - <<'PY'
from pathlib import Path
p=Path("services/api/src/app.module.ts")
s=p.read_text()
a="import { InteractionModule } from './interaction/interaction.module';\n"
if "import { MessageModule }" not in s:
    if a not in s: raise SystemExit("AppModule import anchor missing")
    s=s.replace(a,a+"import { MessageModule } from './message/message.module';\n",1)
if "    MessageModule,\n" not in s:
    a="    InteractionModule,\n"
    if a not in s: raise SystemExit("AppModule module anchor missing")
    s=s.replace(a,a+"    MessageModule,\n",1)
p.write_text(s)
PY

cat > services/api/test/message.dto.test.ts <<'EOF'
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ConversationType, MessageType } from '../src/generated/prisma/client';
import { CreateConversationDto } from '../src/message/dto/create-conversation.dto';
import { CreateMessageDto } from '../src/message/dto/create-message.dto';

describe('Build 0011 messaging DTO validation', () => {
  it('accepts a valid direct conversation request', async () => {
    const dto = plainToInstance(CreateConversationDto, {
      type: ConversationType.DIRECT,
      memberIds: ['0dce56de-d06f-4bfd-b6d1-f5387f642f2a'],
    });
    assert.equal((await validate(dto)).length, 0);
  });

  it('rejects an invalid member identifier', async () => {
    const dto = plainToInstance(CreateConversationDto, {
      type: ConversationType.GROUP,
      memberIds: ['not-a-uuid'],
    });
    assert.ok((await validate(dto)).length > 0);
  });

  it('accepts message content and attachment metadata', async () => {
    const dto = plainToInstance(CreateMessageDto, {
      type: MessageType.FILE,
      content: 'Local planning document',
      clientNonce: 'ios-0011-demo',
      attachments: [{ storageKey: 'messages/demo/file.pdf', fileName: 'file.pdf', mimeType: 'application/pdf', sizeBytes: 2048 }],
    });
    assert.equal((await validate(dto)).length, 0);
  });
});
EOF

cat > docs/architecture/0011-direct-messaging-engine.md <<'EOF'
# Build 0011 — Direct Messaging Engine

Build 0011 establishes the shared communication engine for Neighbour™.

## Models

- `Conversation`
- `ConversationMember`
- `Message`
- `MessageAttachment`
- `MessageReadReceipt`

Notifications now support `MESSAGE`, `conversationId` and `messageId`.

## API

- `POST /api/v1/messages/conversations`
- `GET /api/v1/messages/conversations`
- `GET /api/v1/messages/conversations/:conversationId`
- `PATCH /api/v1/messages/conversations/:conversationId`
- `POST /api/v1/messages/conversations/:conversationId/messages`
- `GET /api/v1/messages/conversations/:conversationId/messages`
- `POST /api/v1/messages/conversations/:conversationId/read`
- `PATCH /api/v1/messages/:messageId`
- `DELETE /api/v1/messages/:messageId`

## Invariants

Direct threads use a canonical key to prevent duplicates. Membership gates every
read and write. Message creation, last-message state, unread counters and
notifications are committed transactionally. Client nonces make retries
idempotent. Deletion is soft and preserves timeline position. Attachment
metadata is storage-provider neutral for Build 0013.

Build 0012 will publish message and read-state changes through WebSockets.
EOF

echo "Generating Prisma client..."
pnpm --filter @neighbour/api exec prisma generate

echo "Creating and applying migration..."
pnpm --filter @neighbour/api exec prisma migrate dev --name add_direct_messaging_engine

echo "Formatting and validating Build 0011..."
pnpm format
pnpm check

echo
echo "Neighbour™ Build 0011 completed successfully."
echo
echo "Suggested commit:"
echo '  git status'
echo '  git add .'
echo '  git commit -m "build: establish direct messaging engine"'
echo '  git push'
