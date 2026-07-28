import { Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import type { Socket } from 'socket.io';

import { DatabaseService } from '../../database/database.service';
import type { RoomMembership } from '../interfaces/room-membership.interface';
import { RoomNameFactory } from './room-name.factory';

@Injectable()
export class ConversationRoomService {
  constructor(private readonly database: DatabaseService) {}

  async join(client: Socket, userId: string, conversationId: string): Promise<RoomMembership> {
    const membership = await this.requireMembership(userId, conversationId);
    const roomName = RoomNameFactory.conversation(conversationId);

    await client.join(roomName);

    return {
      conversationId,
      userId,
      role: membership.role,
      roomName,
      joinedAt: new Date().toISOString(),
    };
  }

  async leave(client: Socket, userId: string, conversationId: string): Promise<RoomMembership> {
    const membership = await this.requireMembership(userId, conversationId);
    const roomName = RoomNameFactory.conversation(conversationId);

    await client.leave(roomName);

    return {
      conversationId,
      userId,
      role: membership.role,
      roomName,
      joinedAt: new Date().toISOString(),
    };
  }

  private async requireMembership(userId: string, conversationId: string) {
    const membership = await this.database.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      select: {
        role: true,
        leftAt: true,
        conversation: {
          select: {
            id: true,
          },
        },
      },
    });

    if (
      !membership ||
      membership.leftAt !== null ||
      membership.conversation.id !== conversationId
    ) {
      throw new WsException('You are not an active member of this conversation.');
    }

    return membership;
  }
}
