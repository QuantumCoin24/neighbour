import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { randomUUID } from 'node:crypto';
import { Server, Socket } from 'socket.io';

import { WebSocketAuthService } from '../auth/websocket-auth.service';
import { RealtimeEvents } from '../constants/realtime-events.constant';
import { RealtimeSocketData } from '../interfaces/realtime-socket-data.interface';
import { PresenceService } from '../presence/presence.service';
import { RoomNameFactory } from '../rooms/room-name.factory';
import { RealtimeService } from '../services/realtime.service';

interface ClientToServerEvents {}

interface ServerToClientEvents {
  'connection.ready': (payload: {
    eventId: string;
    occurredAt: string;
    data: {
      socketId: string;
      userId: string;
      presence: {
        userId: string;
        online: boolean;
        connectionCount: number;
        changedAt: string;
      };
    };
  }) => void;
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

      client.emit(RealtimeEvents.CONNECTION_READY, {
        eventId: randomUUID(),
        occurredAt: new Date().toISOString(),
        data: {
          socketId: client.id,
          userId,
          presence,
        },
      });

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
}
