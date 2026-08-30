import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContentSafetyService } from '../common/content-safety/content-safety.service';
import { DatabaseService } from '../database/database.service';
import { NotificationDeliveryRouterService } from '../notification/delivery/notification-delivery-router.service';
import {
  ConversationMemberRole,
  ConversationType,
  MessageType,
  NotificationType,
  Prisma,
  UserStatus,
} from '../generated/prisma/client';
import type { ConversationQueryDto } from './dto/conversation-query.dto';
import type { CreateConversationDto } from './dto/create-conversation.dto';
import type { CreateMessageDto } from './dto/create-message.dto';
import type { MessageQueryDto } from './dto/message-query.dto';
import type { UpdateConversationStateDto } from './dto/update-conversation-state.dto';
import type { UpdateMessageDto } from './dto/update-message.dto';
import { MessageRealtimePublisher } from './events/message-realtime.publisher';
import type {
  ConversationFeedResponse,
  ConversationResponse,
  MessageFeedResponse,
  MessageResponse,
} from './interfaces/message-response.interface';

const actorSelect = {
  id: true,
  displayName: true,
  profile: { select: { username: true, avatarUrl: true } },
} satisfies Prisma.UserSelect;
const messageInclude = {
  sender: { select: actorSelect },
  attachments: { orderBy: { createdAt: 'asc' } },
} satisfies Prisma.MessageInclude;
const conversationInclude = {
  members: {
    where: { leftAt: null },
    include: { user: { select: actorSelect } },
    orderBy: { joinedAt: 'asc' },
  },
  lastMessage: { include: messageInclude },
} satisfies Prisma.ConversationInclude;
type MessageWithRelations = Prisma.MessageGetPayload<{ include: typeof messageInclude }>;
type ConversationWithRelations = Prisma.ConversationGetPayload<{
  include: typeof conversationInclude;
}>;

@Injectable()
export class MessageService {
  constructor(
    @Inject(DatabaseService)
    private readonly database: DatabaseService,
    @Inject(ContentSafetyService)
    private readonly contentSafety: ContentSafetyService,
    private readonly realtimePublisher: MessageRealtimePublisher,
    private readonly notificationDelivery: NotificationDeliveryRouterService,
  ) {}

  async createConversation(
    userId: string,
    dto: CreateConversationDto,
  ): Promise<ConversationResponse> {
    this.contentSafety.assertAcceptable({
      field: 'title',
      value: dto.title,
    });

    const memberIds = [...new Set([userId, ...dto.memberIds])];
    if (dto.type === ConversationType.DIRECT && memberIds.length !== 2)
      throw new BadRequestException('A direct conversation must contain exactly two members.');
    if (dto.type !== ConversationType.DIRECT && memberIds.length < 2)
      throw new BadRequestException('A conversation must contain at least two members.');

    const users = await this.database.user.findMany({
      where: { id: { in: memberIds }, status: UserStatus.ACTIVE },
      select: { id: true },
    });
    if (users.length !== memberIds.length)
      throw new BadRequestException('One or more conversation members are unavailable.');

    const directKey = dto.type === ConversationType.DIRECT ? [...memberIds].sort().join(':') : null;
    if (directKey) {
      const existing = await this.database.conversation.findUnique({
        where: { directKey },
        include: conversationInclude,
      });
      if (existing) {
        await this.database.conversationMember.updateMany({
          where: { conversationId: existing.id, userId },
          data: { leftAt: null, archivedAt: null },
        });
        return this.requireConversation(userId, existing.id);
      }
    }

    const conversationData: Prisma.ConversationCreateInput = {
      type: dto.type,
      title: dto.title?.trim() || null,
      owner: {
        connect: {
          id: userId,
        },
      },
      ...(dto.communityId
        ? {
            community: {
              connect: {
                id: dto.communityId,
              },
            },
          }
        : {}),
      directKey,
      members: {
        create: memberIds.map((id) => ({
          user: {
            connect: {
              id,
            },
          },
          role: id === userId ? ConversationMemberRole.OWNER : ConversationMemberRole.MEMBER,
        })),
      },
    };

    const conversation = await this.database.conversation.create({
      data: conversationData,
      include: conversationInclude,
    });
    return this.toConversationResponse(conversation);
  }

  async listConversations(
    userId: string,
    query: ConversationQueryDto,
  ): Promise<ConversationFeedResponse> {
    const rows = await this.database.conversation.findMany({
      where: {
        members: {
          some: { userId, leftAt: null, archivedAt: query.archived ? { not: null } : null },
        },
      },
      include: conversationInclude,
      orderBy: [{ lastMessageAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length > query.limit;
    const items = hasMore ? rows.slice(0, query.limit) : rows;
    return {
      items: items.map((x) => this.toConversationResponse(x)),
      nextCursor: hasMore ? (items.at(-1)?.id ?? null) : null,
    };
  }

  async getConversation(userId: string, conversationId: string): Promise<ConversationResponse> {
    return this.requireConversation(userId, conversationId);
  }

  async listMessages(
    userId: string,
    conversationId: string,
    query: MessageQueryDto,
  ): Promise<MessageFeedResponse> {
    await this.requireMembership(userId, conversationId);
    const rows = await this.database.message.findMany({
      where: { conversationId },
      include: messageInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    const hasMore = rows.length > query.limit;
    const items = hasMore ? rows.slice(0, query.limit) : rows;
    return {
      items: items.map((x) => this.toMessageResponse(x)),
      nextCursor: hasMore ? (items.at(-1)?.id ?? null) : null,
    };
  }

  async sendMessage(
    userId: string,
    conversationId: string,
    dto: CreateMessageDto,
  ): Promise<MessageResponse> {
    await this.requireMembership(userId, conversationId);
    const content = dto.content?.trim() || null;

    this.contentSafety.assertAcceptable({
      field: 'content',
      value: content,
    });
    const attachments = dto.attachments ?? [];
    if (!content && attachments.length === 0 && dto.type !== MessageType.SYSTEM)
      throw new BadRequestException('A message requires content or an attachment.');

    if (dto.parentMessageId) {
      const parent = await this.database.message.findFirst({
        where: { id: dto.parentMessageId, conversationId },
        select: { id: true },
      });
      if (!parent)
        throw new BadRequestException('The reply target does not belong to this conversation.');
    }

    if (dto.clientNonce) {
      const existing = await this.database.message.findFirst({
        where: { conversationId, senderId: userId, clientNonce: dto.clientNonce },
        include: messageInclude,
      });
      if (existing) return this.toMessageResponse(existing);
    }

    const message = await this.database.$transaction(async (tx) => {
      const messageData: Prisma.MessageCreateInput = {
        conversation: {
          connect: {
            id: conversationId,
          },
        },
        sender: {
          connect: {
            id: userId,
          },
        },
        type: dto.type,
        content,
        ...(dto.parentMessageId
          ? {
              parentMessage: {
                connect: {
                  id: dto.parentMessageId,
                },
              },
            }
          : {}),
        ...(dto.clientNonce
          ? {
              clientNonce: dto.clientNonce,
            }
          : {}),
        ...(dto.metadata
          ? {
              metadata: dto.metadata as Prisma.InputJsonValue,
            }
          : {}),
        ...(attachments.length
          ? {
              attachments: {
                create: attachments,
              },
            }
          : {}),
      };

      const created = await tx.message.create({
        data: messageData,
        include: messageInclude,
      });
      await tx.conversation.update({
        where: { id: conversationId },
        data: { lastMessageId: created.id, lastMessageAt: created.createdAt },
      });
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
          conversationId,
          leftAt: null,
          userId: { not: userId },
          OR: [{ mutedUntil: null }, { mutedUntil: { lt: new Date() } }],
        },
        select: { userId: true },
      });
      if (recipients.length)
        await tx.notification.createMany({
          data: recipients.map((x) => ({
            recipientId: x.userId,
            actorId: userId,
            conversationId,
            messageId: created.id,
            type: NotificationType.MESSAGE,
            idempotencyKey: `message:${created.id}:${x.userId}`,
          })),
          skipDuplicates: true,
        });
      return created;
    });
    const response = this.toMessageResponse(message);
    await this.realtimePublisher.messageCreated(conversationId, response);

    const messageNotifications = await this.database.notification.findMany({
      where: {
        messageId: message.id,
        type: NotificationType.MESSAGE,
        dismissedAt: null,
      },
      select: {
        id: true,
        recipientId: true,
        type: true,
        postId: true,
        commentId: true,
        communityId: true,
        readAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const pushBody =
      response.content?.trim() ||
      (response.attachments.length > 0 ? 'Sent you an attachment.' : 'Sent you a message.');

    void Promise.allSettled(
      messageNotifications.map((notification) =>
        this.notificationDelivery.route({
          recipientId: notification.recipientId,
          notification: {
            id: notification.id,
            type: notification.type,
            actor: {
              id: response.sender.id,
              displayName: response.sender.displayName,
              username: response.sender.username,
              avatarUrl: response.sender.avatarUrl,
            },
            postId: notification.postId,
            commentId: notification.commentId,
            communityId: notification.communityId,
            readAt: notification.readAt,
            createdAt: notification.createdAt,
            updatedAt: notification.updatedAt,
          },
          pushPayload: {
            aps: {
              alert: {
                title: response.sender.displayName,
                body: pushBody.slice(0, 180),
              },
              sound: 'default',
              'thread-id': conversationId,
            },
            data: {
              type: 'MESSAGE',
              conversationId,
              messageId: message.id,
            },
          },
          collapseId: `conversation:${conversationId}`,
        }),
      ),
    );

    return response;
  }

  async editMessage(
    userId: string,
    messageId: string,
    dto: UpdateMessageDto,
  ): Promise<MessageResponse> {
    const message = await this.requireOwnedMessage(userId, messageId);
    if (message.deletedAt) throw new ConflictException('A deleted message cannot be edited.');

    this.contentSafety.assertAcceptable({
      field: 'content',
      value: dto.content,
    });
    const updated = await this.database.message.update({
      where: { id: messageId },
      data: { content: dto.content.trim(), editedAt: new Date() },
      include: messageInclude,
    });
    const response = this.toMessageResponse(updated);
    await this.realtimePublisher.messageUpdated(updated.conversationId, response);
    return response;
  }

  async deleteMessage(userId: string, messageId: string): Promise<void> {
    const message = await this.requireOwnedMessage(userId, messageId);
    if (message.deletedAt) return;
    const deletedAt = new Date();

    await this.database.$transaction([
      this.database.message.update({
        where: { id: messageId },
        data: { content: null, metadata: Prisma.JsonNull, deletedAt },
      }),
      this.database.messageAttachment.deleteMany({ where: { messageId } }),
      this.database.notification.deleteMany({ where: { messageId } }),
    ]);

    await this.realtimePublisher.messageDeleted({
      messageId,
      conversationId: message.conversationId,
      deletedAt: deletedAt.toISOString(),
    });
  }

  async markRead(
    userId: string,
    conversationId: string,
    messageId?: string,
  ): Promise<{ unreadCount: number; lastReadAt: Date }> {
    await this.requireMembership(userId, conversationId);
    const target = messageId
      ? await this.database.message.findFirst({
          where: { id: messageId, conversationId },
          select: { id: true, createdAt: true },
        })
      : await this.database.message.findFirst({
          where: { conversationId },
          orderBy: { createdAt: 'desc' },
          select: { id: true, createdAt: true },
        });
    if (messageId && !target)
      throw new BadRequestException('Read target does not belong to this conversation.');
    const readAt = target?.createdAt ?? new Date();
    await this.database.$transaction(async (tx) => {
      await tx.conversationMember.update({
        where: { conversationId_userId: { conversationId, userId } },
        data: { unreadCount: 0, lastReadMessageId: target?.id ?? null, lastReadAt: readAt },
      });
      if (target)
        await tx.messageReadReceipt.upsert({
          where: { messageId_userId: { messageId: target.id, userId } },
          create: { messageId: target.id, userId, readAt },
          update: { readAt },
        });
      await tx.notification.updateMany({
        where: {
          recipientId: userId,
          conversationId,
          type: NotificationType.MESSAGE,
          readAt: null,
        },
        data: { readAt: new Date() },
      });
    });
    const response = {
      unreadCount: 0,
      lastReadAt: readAt,
    };

    await this.realtimePublisher.messageRead({
      conversationId,
      userId,
      messageId: target?.id ?? null,
      unreadCount: response.unreadCount,
      lastReadAt: response.lastReadAt.toISOString(),
    });

    return response;
  }

  async updateState(
    userId: string,
    conversationId: string,
    dto: UpdateConversationStateDto,
  ): Promise<ConversationResponse> {
    await this.requireMembership(userId, conversationId);
    const data: Prisma.ConversationMemberUpdateInput = {};
    if (dto.archived !== undefined) data.archivedAt = dto.archived ? new Date() : null;
    if (dto.pinned !== undefined) data.pinnedAt = dto.pinned ? new Date() : null;
    if (dto.mutedUntil !== undefined)
      data.mutedUntil = dto.mutedUntil ? new Date(dto.mutedUntil) : null;
    await this.database.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId } },
      data,
    });
    const response = await this.requireConversation(userId, conversationId);

    await this.realtimePublisher.conversationUpdated(conversationId, response);

    return response;
  }

  private async requireMembership(userId: string, conversationId: string): Promise<void> {
    const found = await this.database.conversationMember.findFirst({
      where: { conversationId, userId, leftAt: null },
      select: { id: true },
    });
    if (!found) throw new NotFoundException('Conversation not found.');
  }

  private async requireConversation(
    userId: string,
    conversationId: string,
  ): Promise<ConversationResponse> {
    await this.requireMembership(userId, conversationId);
    const row = await this.database.conversation.findUnique({
      where: { id: conversationId },
      include: conversationInclude,
    });
    if (!row) throw new NotFoundException('Conversation not found.');
    return this.toConversationResponse(row);
  }

  private async requireOwnedMessage(
    userId: string,
    messageId: string,
  ): Promise<{ deletedAt: Date | null; conversationId: string }> {
    const row = await this.database.message.findUnique({
      where: { id: messageId },
      select: {
        senderId: true,
        deletedAt: true,
        conversationId: true,
      },
    });
    if (!row) throw new NotFoundException('Message not found.');
    if (row.senderId !== userId)
      throw new ForbiddenException('Only the sender may modify this message.');
    return row;
  }

  private toConversationResponse(x: ConversationWithRelations): ConversationResponse {
    return {
      id: x.id,
      type: x.type,
      title: x.title,
      communityId: x.communityId,
      ownerId: x.ownerId,
      members: x.members.map((m) => ({
        user: {
          id: m.user.id,
          displayName: m.user.displayName,
          username: m.user.profile?.username ?? null,
          avatarUrl: m.user.profile?.avatarUrl ?? null,
        },
        role: m.role,
        joinedAt: m.joinedAt,
        mutedUntil: m.mutedUntil,
        pinnedAt: m.pinnedAt,
        archivedAt: m.archivedAt,
        unreadCount: m.unreadCount,
        lastReadAt: m.lastReadAt,
      })),
      lastMessage: x.lastMessage ? this.toMessageResponse(x.lastMessage) : null,
      lastMessageAt: x.lastMessageAt,
      createdAt: x.createdAt,
      updatedAt: x.updatedAt,
    };
  }

  private toMessageResponse(x: MessageWithRelations): MessageResponse {
    return {
      id: x.id,
      conversationId: x.conversationId,
      sender: {
        id: x.sender.id,
        displayName: x.sender.displayName,
        username: x.sender.profile?.username ?? null,
        avatarUrl: x.sender.profile?.avatarUrl ?? null,
      },
      parentMessageId: x.parentMessageId,
      type: x.type,
      content: x.deletedAt ? null : x.content,
      metadata: x.deletedAt ? null : x.metadata,
      attachments: x.deletedAt
        ? []
        : x.attachments.map((a) => ({
            id: a.id,
            storageKey: a.storageKey,
            fileName: a.fileName,
            mimeType: a.mimeType,
            sizeBytes: a.sizeBytes,
            width: a.width,
            height: a.height,
            durationMs: a.durationMs,
          })),
      editedAt: x.editedAt,
      deletedAt: x.deletedAt,
      createdAt: x.createdAt,
      updatedAt: x.updatedAt,
    };
  }
}
