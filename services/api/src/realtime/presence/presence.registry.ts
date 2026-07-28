import { Injectable } from '@nestjs/common';

@Injectable()
export class PresenceRegistry {
  private readonly socketsByUser = new Map<string, Set<string>>();
  private readonly userBySocket = new Map<string, string>();

  register(userId: string, socketId: string): boolean {
    const existingSockets = this.socketsByUser.get(userId);
    const wasOffline = !existingSockets || existingSockets.size === 0;

    const sockets = existingSockets ?? new Set<string>();
    sockets.add(socketId);

    this.socketsByUser.set(userId, sockets);
    this.userBySocket.set(socketId, userId);

    return wasOffline;
  }

  unregister(socketId: string): {
    userId: string | null;
    becameOffline: boolean;
  } {
    const userId = this.userBySocket.get(socketId);

    if (!userId) {
      return {
        userId: null,
        becameOffline: false,
      };
    }

    this.userBySocket.delete(socketId);

    const sockets = this.socketsByUser.get(userId);

    if (!sockets) {
      return {
        userId,
        becameOffline: true,
      };
    }

    sockets.delete(socketId);

    if (sockets.size === 0) {
      this.socketsByUser.delete(userId);

      return {
        userId,
        becameOffline: true,
      };
    }

    return {
      userId,
      becameOffline: false,
    };
  }

  isOnline(userId: string): boolean {
    return (this.socketsByUser.get(userId)?.size ?? 0) > 0;
  }

  getUserId(socketId: string): string | null {
    return this.userBySocket.get(socketId) ?? null;
  }

  getSocketIds(userId: string): string[] {
    return [...(this.socketsByUser.get(userId) ?? [])];
  }

  getOnlineUserIds(): string[] {
    return [...this.socketsByUser.keys()];
  }

  getConnectionCount(userId: string): number {
    return this.socketsByUser.get(userId)?.size ?? 0;
  }

  clear(): void {
    this.socketsByUser.clear();
    this.userBySocket.clear();
  }
}
