import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { NotificationType, Prisma } from '../generated/prisma/client';
import type { NotificationQueryDto } from './dto/notification-query.dto';
import { NotificationRealtimePublisher } from './events/notification-realtime.publisher';
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
    private readonly realtimePublisher: NotificationRealtimePublisher,
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
    const items = hasMore ? notifications.slice(0, query.limit) : notifications;

    return {
      items: items.map((notification) => this.toNotificationResponse(notification)),
      nextCursor: hasMore ? (items.at(-1)?.id ?? null) : null,
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

  async markRead(recipientId: string, notificationId: string): Promise<NotificationResponse> {
    const existing = await this.requireOwnedNotification(recipientId, notificationId);

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

    const notification = await this.requireNotificationWithActor(notificationId);

    this.realtimePublisher.notificationRead({
      notificationId,
      recipientId,
      readAt: notification.readAt?.toISOString() ?? new Date().toISOString(),
      updatedCount: existing.readAt ? 0 : 1,
      all: false,
      notification,
    });

    return notification;
  }

  async markAllRead(recipientId: string): Promise<{ updatedCount: number }> {
    const readAt = new Date();

    const result = await this.database.notification.updateMany({
      where: {
        recipientId,
        dismissedAt: null,
        readAt: null,
      },
      data: {
        readAt,
      },
    });

    this.realtimePublisher.notificationRead({
      notificationId: null,
      recipientId,
      readAt: readAt.toISOString(),
      updatedCount: result.count,
      all: true,
    });

    return {
      updatedCount: result.count,
    };
  }

  async dismiss(recipientId: string, notificationId: string): Promise<void> {
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

    const notification = await this.database.notification.upsert({
      where: {
        idempotencyKey: `comment:${input.commentId}`,
      },
      create: {
        recipientId: input.recipientId,
        actorId: input.actorId,
        postId: input.postId,
        commentId: input.commentId,
        type: input.isReply ? NotificationType.REPLY : NotificationType.COMMENT,
        idempotencyKey: `comment:${input.commentId}`,
      },
      update: {
        dismissedAt: null,
        readAt: null,
      },
      include: notificationInclude,
    });

    this.realtimePublisher.notificationCreated(
      input.recipientId,
      this.toNotificationResponse(notification),
    );
  }

  async notifyReaction(input: ReactionNotificationInput): Promise<void> {
    if (input.recipientId === input.actorId) {
      return;
    }

    const idempotencyKey = `reaction:${input.postId}:${input.actorId}`;

    const notification = await this.database.notification.upsert({
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
      include: notificationInclude,
    });

    this.realtimePublisher.notificationCreated(
      input.recipientId,
      this.toNotificationResponse(notification),
    );
  }

  async removeReactionNotification(actorId: string, postId: string): Promise<void> {
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

  private toNotificationResponse(notification: NotificationWithActor): NotificationResponse {
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
