import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';
import { RealtimeEvents } from '../../realtime/constants/realtime-events.constant';
import type { RealtimeEvent } from '../../realtime/constants/realtime-events.constant';
import { RealtimeService } from '../../realtime/services/realtime.service';

export interface MessageDeletedRealtimePayload {
  messageId: string;
  conversationId: string;
  deletedAt: string;
}

export interface MessageReadRealtimePayload {
  conversationId: string;
  userId: string;
  messageId: string | null;
  unreadCount: number;
  lastReadAt: string;
}

@Injectable()
export class MessageRealtimePublisher {
  constructor(
    private readonly database: DatabaseService,
    private readonly realtime: RealtimeService,
  ) {}

  async messageCreated(conversationId: string, payload: unknown): Promise<void> {
    await this.publishConversationEvent(conversationId, RealtimeEvents.MESSAGE_CREATED, payload);

    await this.publishConversationChanged(conversationId);
  }

  async messageUpdated(conversationId: string, payload: unknown): Promise<void> {
    await this.publishConversationEvent(conversationId, RealtimeEvents.MESSAGE_UPDATED, payload);

    await this.publishConversationChanged(conversationId);
  }

  async messageDeleted(payload: MessageDeletedRealtimePayload): Promise<void> {
    await this.publishConversationEvent(
      payload.conversationId,
      RealtimeEvents.MESSAGE_DELETED,
      payload,
    );

    await this.publishConversationChanged(payload.conversationId);
  }

  async messageRead(payload: MessageReadRealtimePayload): Promise<void> {
    await this.publishConversationEvent(
      payload.conversationId,
      RealtimeEvents.MESSAGE_READ,
      payload,
    );

    await this.publishConversationChanged(payload.conversationId);
  }

  async conversationUpdated(conversationId: string, payload: unknown): Promise<void> {
    await this.publishConversationEvent(
      conversationId,
      RealtimeEvents.CONVERSATION_UPDATED,
      payload,
    );
  }

  private async publishConversationChanged(conversationId: string): Promise<void> {
    const payload = {
      conversationId,
      updatedAt: new Date().toISOString(),
    };

    await this.publishConversationEvent(
      conversationId,
      RealtimeEvents.CONVERSATION_UPDATED,
      payload,
    );
  }

  private async publishConversationEvent(
    conversationId: string,
    event: RealtimeEvent,
    payload: unknown,
  ): Promise<void> {
    const envelope = {
      event,
      occurredAt: new Date().toISOString(),
      data: payload,
    };

    this.realtime.emitToConversation(conversationId, event, envelope);

    const members = await this.database.conversationMember.findMany({
      where: {
        conversationId,
        leftAt: null,
      },
      select: {
        userId: true,
      },
    });

    for (const member of members) {
      this.realtime.emitToUser(member.userId, event, envelope);
    }
  }
}
