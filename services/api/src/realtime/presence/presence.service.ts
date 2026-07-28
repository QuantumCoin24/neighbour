import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { RealtimeEvents } from '../constants/realtime-events.constant';
import { PresenceState } from '../interfaces/presence-state.interface';
import { RoomNameFactory } from '../rooms/room-name.factory';
import { RealtimeService } from '../services/realtime.service';
import { PresenceRegistry } from './presence.registry';

@Injectable()
export class PresenceService {
  constructor(
    private readonly registry: PresenceRegistry,
    private readonly realtimeService: RealtimeService,
  ) {}

  connect(userId: string, socketId: string): PresenceState {
    const becameOnline = this.registry.register(userId, socketId);
    const state = this.getState(userId);

    if (becameOnline) {
      this.broadcastState(state);
    }

    return state;
  }

  disconnect(socketId: string): PresenceState | null {
    const result = this.registry.unregister(socketId);

    if (!result.userId) {
      return null;
    }

    const state = this.getState(result.userId);

    if (result.becameOffline) {
      this.broadcastState(state);
    }

    return state;
  }

  getState(userId: string): PresenceState {
    return {
      userId,
      online: this.registry.isOnline(userId),
      connectionCount: this.registry.getConnectionCount(userId),
      changedAt: new Date().toISOString(),
    };
  }

  isOnline(userId: string): boolean {
    return this.registry.isOnline(userId);
  }

  getOnlineUserIds(): string[] {
    return this.registry.getOnlineUserIds();
  }

  private broadcastState(state: PresenceState): void {
    this.realtimeService.emitToRoom(
      RoomNameFactory.user(state.userId),
      RealtimeEvents.PRESENCE_CHANGED,
      {
        eventId: randomUUID(),
        occurredAt: state.changedAt,
        data: state,
      },
    );
  }
}
