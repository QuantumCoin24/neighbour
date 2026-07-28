import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { RoomNameFactory } from '../rooms/room-name.factory';

@Injectable()
export class RealtimeService {
  private server?: Server;

  setServer(server: Server): void {
    this.server = server;
  }

  getServer(): Server | undefined {
    return this.server;
  }

  emitToRoom(room: string, event: string, payload: unknown): void {
    this.server?.to(room).emit(event, payload);
  }

  emitToUser(userId: string, event: string, payload: unknown): void {
    this.emitToRoom(RoomNameFactory.user(userId), event, payload);
  }

  emitToConversation(conversationId: string, event: string, payload: unknown): void {
    this.emitToRoom(RoomNameFactory.conversation(conversationId), event, payload);
  }
}
