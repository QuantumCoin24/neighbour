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
  ) {}

  afterInit(server: Server): void {
    this.realtimeService.setServer(server);
    this.logger.log('Realtime gateway initialised');
  }

  async handleConnection(client: RealtimeSocket): Promise<void> {
    const userId = this.resolveUserId(client);

    if (!userId) {
      this.logger.warn(`Rejected unauthenticated realtime connection ${client.id}`);
      client.disconnect(true);
      return;
    }

    client.data.userId = userId;

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

    this.logger.log(`Realtime client connected: ${userId} (${client.id})`);
  }

  handleDisconnect(client: RealtimeSocket): void {
    const presence = this.presenceService.disconnect(client.id);

    if (!presence) {
      this.logger.debug(`Realtime client disconnected without presence record: ${client.id}`);
      return;
    }

    this.logger.log(`Realtime client disconnected: ${presence.userId} (${client.id})`);
  }

  private resolveUserId(client: RealtimeSocket): string | null {
    const authenticationUserId = client.handshake.auth?.userId;
    const queryUserId = client.handshake.query?.userId;

    if (typeof authenticationUserId === 'string' && authenticationUserId.trim().length > 0) {
      return authenticationUserId.trim();
    }

    if (typeof queryUserId === 'string' && queryUserId.trim().length > 0) {
      return queryUserId.trim();
    }

    return null;
  }
}
