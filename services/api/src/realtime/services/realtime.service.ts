import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class RealtimeService {
  private server?: Server;

  setServer(server: Server) {
    this.server = server;
  }

  getServer() {
    return this.server;
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server?.to(`user:${userId}`).emit(event, payload);
  }

  emitToConversation(id: string, event: string, payload: unknown) {
    this.server?.to(`conversation:${id}`).emit(event, payload);
  }
}
