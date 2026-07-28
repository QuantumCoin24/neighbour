import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { randomUUID } from 'node:crypto';
import { Server, Socket } from 'socket.io';

import { WebSocketAuthService } from '../auth/websocket-auth.service';
import { RealtimeEvents } from '../constants/realtime-events.constant';
import type { ConversationRoomDto } from '../dto/conversation-room.dto';
import type { RealtimeSocketData } from '../interfaces/realtime-socket-data.interface';
import type { RoomMembership } from '../interfaces/room-membership.interface';
import { PresenceService } from '../presence/presence.service';
import { ConversationRoomService } from '../rooms/conversation-room.service';
import { RoomNameFactory } from '../rooms/room-name.factory';
import { RealtimeService } from '../services/realtime.service';

interface RealtimeEnvelope<T> {
  eventId: string;
  occurredAt: string;
  data: T;
}

interface ClientToServerEvents {
  'room.join': (
    payload: ConversationRoomDto,
    acknowledgement?: (response: RealtimeEnvelope<RoomMembership>) => void,
  ) => void;

  'room.leave': (
    payload: ConversationRoomDto,
    acknowledgement?: (response: RealtimeEnvelope<RoomMembership>) => void,
  ) => void;
}

interface ServerToClientEvents {
  'connection.ready': (
    payload: RealtimeEnvelope<{
      socketId: string;
      userId: string;
      presence: {
        userId: string;
        online: boolean;
        connectionCount: number;
        changedAt: string;
      };
    }>,
  ) => void;

  'room.joined': (payload: RealtimeEnvelope<RoomMembership>) => void;

  'room.left': (payload: RealtimeEnvelope<RoomMembership>) => void;
}

type RealtimeSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  RealtimeSocketData
>;

@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly realtimeService: RealtimeService,
    private readonly presenceService: PresenceService,
    private readonly websocketAuthService: WebSocketAuthService,
    private readonly conversationRoomService: ConversationRoomService,
  ) {}

  afterInit(server: Server): void {
    this.realtimeService.setServer(server);
    this.logger.log('Realtime gateway initialised');
  }

  async handleConnection(client: RealtimeSocket): Promise<void> {
    try {
      const authentication = await this.websocketAuthService.authenticate(client);

      const userId = authentication.user.id;

      client.data.userId = userId;
      client.data.user = authentication.user;
      client.data.authenticatedAt = new Date().toISOString();

      await client.join(RoomNameFactory.user(userId));

      const presence = this.presenceService.connect(userId, client.id);

      client.emit(
        RealtimeEvents.CONNECTION_READY,
        this.createEnvelope({
          socketId: client.id,
          userId,
          presence,
        }),
      );

      this.logger.log(`Authenticated realtime client connected: ${userId} (${client.id})`);
    } catch {
      this.logger.warn(`Rejected unauthenticated realtime connection ${client.id}`);

      client.disconnect(true);
    }
  }

  handleDisconnect(client: RealtimeSocket): void {
    const presence = this.presenceService.disconnect(client.id);

    if (!presence) {
      this.logger.debug(`Realtime client disconnected without presence record: ${client.id}`);
      return;
    }

    this.logger.log(`Realtime client disconnected: ${presence.userId} (${client.id})`);
  }

  @SubscribeMessage(RealtimeEvents.ROOM_JOIN)
  async joinConversationRoom(
    @ConnectedSocket() client: RealtimeSocket,
    @MessageBody() payload: ConversationRoomDto,
  ): Promise<RealtimeEnvelope<RoomMembership>> {
    const userId = this.requireAuthenticatedUserId(client);
    const conversationId = this.requireConversationId(payload);

    const membership = await this.conversationRoomService.join(client, userId, conversationId);

    const envelope = this.createEnvelope(membership);

    client.emit(RealtimeEvents.ROOM_JOINED, envelope);

    return envelope;
  }

  @SubscribeMessage(RealtimeEvents.ROOM_LEAVE)
  async leaveConversationRoom(
    @ConnectedSocket() client: RealtimeSocket,
    @MessageBody() payload: ConversationRoomDto,
  ): Promise<RealtimeEnvelope<RoomMembership>> {
    const userId = this.requireAuthenticatedUserId(client);
    const conversationId = this.requireConversationId(payload);

    const membership = await this.conversationRoomService.leave(client, userId, conversationId);

    const envelope = this.createEnvelope(membership);

    client.emit(RealtimeEvents.ROOM_LEFT, envelope);

    return envelope;
  }

  private requireAuthenticatedUserId(client: RealtimeSocket): string {
    const userId = client.data.userId;

    if (!userId) {
      throw new WsException('The realtime connection is not authenticated.');
    }

    return userId;
  }

  private requireConversationId(payload: ConversationRoomDto): string {
    const conversationId = payload?.conversationId?.trim();

    if (!conversationId) {
      throw new WsException('A conversationId is required.');
    }

    return conversationId;
  }

  private createEnvelope<T>(data: T): RealtimeEnvelope<T> {
    return {
      eventId: randomUUID(),
      occurredAt: new Date().toISOString(),
      data,
    };
  }
}
