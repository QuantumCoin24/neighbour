#!/usr/bin/env bash

###############################################################################
#
#  Neighbour™
#  Build 0012 — Realtime Gateway
#
###############################################################################

set -Eeuo pipefail

BUILD="0012"
TITLE="Realtime Gateway"

ROOT="$(pwd)"

###############################################################################
# Colours
###############################################################################

GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m"

###############################################################################
# Helper Functions
###############################################################################

section() {
    echo
    echo -e "${BLUE}============================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================================${NC}"
    echo
}

success() {
    echo -e "${GREEN}✔ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

failure() {
    echo -e "${RED}✖ $1${NC}"
    exit 1
}

###############################################################################
# Banner
###############################################################################

clear

echo
echo "============================================================"
echo "             Neighbour™ Platform Bootstrap"
echo
echo "             Build ${BUILD}"
echo "             ${TITLE}"
echo "============================================================"
echo
###############################################################################
# Step 1 — Environment Validation
###############################################################################

section "[1/12] Validating development environment"

command -v pnpm >/dev/null 2>&1 || failure "pnpm is not installed or not available in PATH"
command -v node >/dev/null 2>&1 || failure "Node.js is not installed or not available in PATH"
command -v git >/dev/null 2>&1 || failure "Git is not installed or not available in PATH"

[[ -f "${ROOT}/package.json" ]] || failure "package.json was not found. Run this script from the Neighbour repository root."
[[ -d "${ROOT}/services/api" ]] || failure "services/api was not found."
[[ -f "${ROOT}/services/api/package.json" ]] || failure "services/api/package.json was not found."
[[ -f "${ROOT}/services/api/src/app.module.ts" ]] || failure "services/api/src/app.module.ts was not found."

NODE_VERSION="$(node --version)"
PNPM_VERSION="$(pnpm --version)"
GIT_VERSION="$(git --version)"

echo "Repository root: ${ROOT}"
echo "Node.js: ${NODE_VERSION}"
echo "pnpm: ${PNPM_VERSION}"
echo "Git: ${GIT_VERSION}"

success "Development environment validated"
###############################################################################
# Step Runner
###############################################################################

run_step() {

    local TITLE="$1"

    shift

    section "$TITLE"

    "$@"

    success "$TITLE completed"

}
###############################################################################
# Build Functions
###############################################################################

install_dependencies() {

    echo "Installing NestJS 11 realtime dependencies into @neighbour/api..."

    pnpm --filter @neighbour/api add \
        @nestjs/websockets@^11 \
        @nestjs/platform-socket.io@^11 \
        socket.io@^4.8

    echo "Installing Socket.IO test client into @neighbour/api..."

    pnpm --filter @neighbour/api add -D \
        socket.io-client@^4.8
}

create_structure() {

    local REALTIME_ROOT="${ROOT}/services/api/src/realtime"

    echo "Creating realtime directory structure..."

    mkdir -p \
        "${REALTIME_ROOT}/auth" \
        "${REALTIME_ROOT}/constants" \
        "${REALTIME_ROOT}/decorators" \
        "${REALTIME_ROOT}/dto" \
        "${REALTIME_ROOT}/events" \
        "${REALTIME_ROOT}/gateway" \
        "${REALTIME_ROOT}/guards" \
        "${REALTIME_ROOT}/interfaces" \
        "${REALTIME_ROOT}/presence" \
        "${REALTIME_ROOT}/rooms" \
        "${REALTIME_ROOT}/services" \
        "${REALTIME_ROOT}/utils"

    find "${REALTIME_ROOT}" -type d -exec touch {}/.gitkeep \;

    echo "Realtime structure created at:"
    echo "${REALTIME_ROOT}"
}

build_gateway() {

    local REALTIME_ROOT="${ROOT}/services/api/src/realtime"

    echo "Creating realtime gateway..."

    cat > "${REALTIME_ROOT}/services/realtime.service.ts" <<'EOF'
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
EOF

    cat > "${REALTIME_ROOT}/gateway/realtime.gateway.ts" <<'EOF'
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { RealtimeService } from '../services/realtime.service';

@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayInit {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(private readonly realtime: RealtimeService) {}

  afterInit(server: Server) {
    this.realtime.setServer(server);
    this.logger.log('Realtime gateway initialised');
  }
}
EOF

    cat > "${REALTIME_ROOT}/realtime.module.ts" <<'EOF'
import { Module } from '@nestjs/common';
import { RealtimeGateway } from './gateway/realtime.gateway';
import { RealtimeService } from './services/realtime.service';

@Module({
  providers: [RealtimeGateway, RealtimeService],
  exports: [RealtimeGateway, RealtimeService],
})
export class RealtimeModule {}
EOF

    rm -f \
        "${REALTIME_ROOT}/gateway/.gitkeep" \
        "${REALTIME_ROOT}/services/.gitkeep"

    echo "Realtime gateway files created."
}

wire_realtime_module() {

    local APP_MODULE="${ROOT}/services/api/src/app.module.ts"

    echo "Wiring RealtimeModule into AppModule..."

    python3 - "${APP_MODULE}" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
text = path.read_text()

import_line = "import { RealtimeModule } from './realtime/realtime.module';"

if import_line not in text:
    marker = "import { SocialGraphModule } from './social-graph/social-graph.module';"
    text = text.replace(marker, marker + "\n" + import_line)

if "    RealtimeModule," not in text:
    marker = "    SocialGraphModule,"
    text = text.replace(marker, marker + "\n    RealtimeModule,")

path.write_text(text)
PY

    echo "RealtimeModule wired into AppModule."
}

build_realtime_contracts() {

    local REALTIME_ROOT="${ROOT}/services/api/src/realtime"

    echo "Creating realtime room and event contracts..."

    cat > "${REALTIME_ROOT}/constants/realtime-events.constant.ts" <<'EOF'
export const RealtimeEvents = {
  CONNECTION_READY: 'connection.ready',

  HEARTBEAT: 'heartbeat',
  HEARTBEAT_ACKNOWLEDGED: 'heartbeat.acknowledged',

  PRESENCE_ONLINE: 'presence.online',
  PRESENCE_OFFLINE: 'presence.offline',
  PRESENCE_CHANGED: 'presence.changed',

  ROOM_JOIN: 'room.join',
  ROOM_JOINED: 'room.joined',
  ROOM_LEAVE: 'room.leave',
  ROOM_LEFT: 'room.left',

  TYPING_START: 'typing.start',
  TYPING_STOP: 'typing.stop',

  MESSAGE_CREATED: 'message.created',
  MESSAGE_UPDATED: 'message.updated',
  MESSAGE_DELETED: 'message.deleted',
  MESSAGE_READ: 'message.read',

  CONVERSATION_UPDATED: 'conversation.updated',

  NOTIFICATION_CREATED: 'notification.created',
  NOTIFICATION_READ: 'notification.read',
} as const;

export type RealtimeEvent =
  (typeof RealtimeEvents)[keyof typeof RealtimeEvents];
EOF

    cat > "${REALTIME_ROOT}/rooms/room-name.factory.ts" <<'EOF'
export class RoomNameFactory {
  static user(userId: string): string {
    return `user:${userId}`;
  }

  static conversation(conversationId: string): string {
    return `conversation:${conversationId}`;
  }

  static community(communityId: string): string {
    return `community:${communityId}`;
  }

  static business(businessId: string): string {
    return `business:${businessId}`;
  }

  static organisation(organisationId: string): string {
    return `organisation:${organisationId}`;
  }

  static event(eventId: string): string {
    return `event:${eventId}`;
  }
}
EOF

    cat > "${REALTIME_ROOT}/interfaces/realtime-payload.interface.ts" <<'EOF'
export interface RealtimePayload<TData = unknown> {
  eventId: string;
  occurredAt: string;
  data: TData;
}
EOF

    rm -f \
        "${REALTIME_ROOT}/constants/.gitkeep" \
        "${REALTIME_ROOT}/interfaces/.gitkeep" \
        "${REALTIME_ROOT}/rooms/.gitkeep"

    echo "Realtime contracts created."
}

build_presence_engine() {

    local REALTIME_ROOT="${ROOT}/services/api/src/realtime"

    echo "Creating realtime presence engine..."

    cat > "${REALTIME_ROOT}/presence/presence.registry.ts" <<'EOF'
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
EOF

    cat > "${REALTIME_ROOT}/interfaces/presence-state.interface.ts" <<'EOF'
export interface PresenceState {
  userId: string;
  online: boolean;
  connectionCount: number;
  changedAt: string;
}
EOF

    cat > "${REALTIME_ROOT}/presence/presence.service.ts" <<'EOF'
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
EOF

    cat > "${REALTIME_ROOT}/services/realtime.service.ts" <<'EOF'
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

  emitToConversation(
    conversationId: string,
    event: string,
    payload: unknown,
  ): void {
    this.emitToRoom(
      RoomNameFactory.conversation(conversationId),
      event,
      payload,
    );
  }
}
EOF

    cat > "${REALTIME_ROOT}/realtime.module.ts" <<'EOF'
import { Module } from '@nestjs/common';
import { RealtimeGateway } from './gateway/realtime.gateway';
import { PresenceRegistry } from './presence/presence.registry';
import { PresenceService } from './presence/presence.service';
import { RealtimeService } from './services/realtime.service';

@Module({
  providers: [
    RealtimeGateway,
    RealtimeService,
    PresenceRegistry,
    PresenceService,
  ],
  exports: [
    RealtimeGateway,
    RealtimeService,
    PresenceRegistry,
    PresenceService,
  ],
})
export class RealtimeModule {}
EOF

    rm -f \
        "${REALTIME_ROOT}/presence/.gitkeep" \
        "${REALTIME_ROOT}/interfaces/.gitkeep"

    echo "Realtime presence engine created."
}


wire_gateway_lifecycle() {

    local REALTIME_ROOT="${ROOT}/services/api/src/realtime"

    echo "Wiring gateway connection lifecycle..."

    cat > "${REALTIME_ROOT}/interfaces/realtime-socket-data.interface.ts" <<'EOF'
export interface RealtimeSocketData {
  userId?: string;
}
EOF

    cat > "${REALTIME_ROOT}/gateway/realtime.gateway.ts" <<'EOF'
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

type RealtimeSocket = Socket<
  Record<string, never>,
  Record<string, never>,
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
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
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
      this.logger.warn(
        `Rejected unauthenticated realtime connection ${client.id}`,
      );
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
      this.logger.debug(
        `Realtime client disconnected without presence record: ${client.id}`,
      );
      return;
    }

    this.logger.log(
      `Realtime client disconnected: ${presence.userId} (${client.id})`,
    );
  }

  private resolveUserId(client: RealtimeSocket): string | null {
    const authenticationUserId = client.handshake.auth?.userId;
    const queryUserId = client.handshake.query?.userId;

    if (
      typeof authenticationUserId === 'string' &&
      authenticationUserId.trim().length > 0
    ) {
      return authenticationUserId.trim();
    }

    if (typeof queryUserId === 'string' && queryUserId.trim().length > 0) {
      return queryUserId.trim();
    }

    return null;
  }
}
EOF

    rm -f "${REALTIME_ROOT}/interfaces/.gitkeep"

    echo "Gateway lifecycle wired."
}


build_websocket_authentication() {

    local REALTIME_ROOT="${ROOT}/services/api/src/realtime"

    echo "Building JWT WebSocket authentication..."

    cat > "${REALTIME_ROOT}/auth/websocket-auth.interface.ts" <<'EOF'
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';

export interface WebSocketAuthenticationResult {
  token: string;
  user: AuthUser;
}
EOF

    cat > "${REALTIME_ROOT}/auth/websocket-auth.service.ts" <<'EOF'
import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { Socket } from 'socket.io';

import { AuthService } from '../../auth/auth.service';
import type { WebSocketAuthenticationResult } from './websocket-auth.interface';

@Injectable()
export class WebSocketAuthService {
  constructor(private readonly authService: AuthService) {}

  async authenticate(client: Socket): Promise<WebSocketAuthenticationResult> {
    const token = this.extractAccessToken(client);

    const payload = await this.authService.verifyAccessToken(token);
    const user = await this.authService.findAuthenticatedUser(payload.sub);

    return {
      token,
      user,
    };
  }

  private extractAccessToken(client: Socket): string {
    const authToken = client.handshake.auth?.token;
    const authorizationHeader = client.handshake.headers.authorization;

    if (typeof authToken === 'string' && authToken.trim().length > 0) {
      return this.removeBearerPrefix(authToken);
    }

    if (
      typeof authorizationHeader === 'string' &&
      authorizationHeader.trim().length > 0
    ) {
      return this.removeBearerPrefix(authorizationHeader);
    }

    throw new UnauthorizedException(
      'A valid WebSocket access token is required.',
    );
  }

  private removeBearerPrefix(value: string): string {
    const token = value.trim().replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      throw new UnauthorizedException(
        'A valid WebSocket access token is required.',
      );
    }

    return token;
  }
}
EOF

    cat > "${REALTIME_ROOT}/interfaces/realtime-socket-data.interface.ts" <<'EOF'
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';

export interface RealtimeSocketData {
  userId?: string;
  user?: AuthUser;
  authenticatedAt?: string;
}
EOF

    cat > "${REALTIME_ROOT}/gateway/realtime.gateway.ts" <<'EOF'
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
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
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
      const authentication =
        await this.websocketAuthService.authenticate(client);

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

      this.logger.log(
        `Authenticated realtime client connected: ${userId} (${client.id})`,
      );
    } catch {
      this.logger.warn(
        `Rejected unauthenticated realtime connection ${client.id}`,
      );

      client.disconnect(true);
    }
  }

  handleDisconnect(client: RealtimeSocket): void {
    const presence = this.presenceService.disconnect(client.id);

    if (!presence) {
      this.logger.debug(
        `Realtime client disconnected without presence record: ${client.id}`,
      );
      return;
    }

    this.logger.log(
      `Realtime client disconnected: ${presence.userId} (${client.id})`,
    );
  }
}
EOF

    cat > "${REALTIME_ROOT}/realtime.module.ts" <<'EOF'
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { WebSocketAuthService } from './auth/websocket-auth.service';
import { RealtimeGateway } from './gateway/realtime.gateway';
import { PresenceRegistry } from './presence/presence.registry';
import { PresenceService } from './presence/presence.service';
import { RealtimeService } from './services/realtime.service';

@Module({
  imports: [AuthModule],
  providers: [
    RealtimeGateway,
    RealtimeService,
    PresenceRegistry,
    PresenceService,
    WebSocketAuthService,
  ],
  exports: [
    RealtimeGateway,
    RealtimeService,
    PresenceRegistry,
    PresenceService,
    WebSocketAuthService,
  ],
})
export class RealtimeModule {}
EOF

    rm -f "${REALTIME_ROOT}/auth/.gitkeep"

    echo "JWT WebSocket authentication created."
}


build_conversation_rooms() {

    local REALTIME_ROOT="${ROOT}/services/api/src/realtime"

    echo "Building authenticated conversation room management..."

    cat > "${REALTIME_ROOT}/interfaces/room-membership.interface.ts" <<'EOF'
import type { ConversationMemberRole } from '../../generated/prisma/enums.js';

export interface RoomMembership {
  conversationId: string;
  userId: string;
  role: ConversationMemberRole;
  roomName: string;
  joinedAt: string;
}
EOF

    cat > "${REALTIME_ROOT}/dto/conversation-room.dto.ts" <<'EOF'
export interface ConversationRoomDto {
  conversationId: string;
}
EOF

    cat > "${REALTIME_ROOT}/rooms/conversation-room.service.ts" <<'EOF'
import { Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import type { Socket } from 'socket.io';

import { DatabaseService } from '../../database/database.service';
import type { RoomMembership } from '../interfaces/room-membership.interface';
import { RoomNameFactory } from './room-name.factory';

@Injectable()
export class ConversationRoomService {
  constructor(private readonly database: DatabaseService) {}

  async join(
    client: Socket,
    userId: string,
    conversationId: string,
  ): Promise<RoomMembership> {
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

  async leave(
    client: Socket,
    userId: string,
    conversationId: string,
  ): Promise<RoomMembership> {
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

  private async requireMembership(
    userId: string,
    conversationId: string,
  ) {
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
      throw new WsException(
        'You are not an active member of this conversation.',
      );
    }

    return membership;
  }
}
EOF

    cat > "${REALTIME_ROOT}/gateway/realtime.gateway.ts" <<'EOF'
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
    acknowledgement?: (
      response: RealtimeEnvelope<RoomMembership>,
    ) => void,
  ) => void;

  'room.leave': (
    payload: ConversationRoomDto,
    acknowledgement?: (
      response: RealtimeEnvelope<RoomMembership>,
    ) => void,
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

  'room.joined': (
    payload: RealtimeEnvelope<RoomMembership>,
  ) => void;

  'room.left': (
    payload: RealtimeEnvelope<RoomMembership>,
  ) => void;
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
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
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
      const authentication =
        await this.websocketAuthService.authenticate(client);

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

      this.logger.log(
        `Authenticated realtime client connected: ${userId} (${client.id})`,
      );
    } catch {
      this.logger.warn(
        `Rejected unauthenticated realtime connection ${client.id}`,
      );

      client.disconnect(true);
    }
  }

  handleDisconnect(client: RealtimeSocket): void {
    const presence = this.presenceService.disconnect(client.id);

    if (!presence) {
      this.logger.debug(
        `Realtime client disconnected without presence record: ${client.id}`,
      );
      return;
    }

    this.logger.log(
      `Realtime client disconnected: ${presence.userId} (${client.id})`,
    );
  }

  @SubscribeMessage(RealtimeEvents.ROOM_JOIN)
  async joinConversationRoom(
    @ConnectedSocket() client: RealtimeSocket,
    @MessageBody() payload: ConversationRoomDto,
  ): Promise<RealtimeEnvelope<RoomMembership>> {
    const userId = this.requireAuthenticatedUserId(client);
    const conversationId = this.requireConversationId(payload);

    const membership = await this.conversationRoomService.join(
      client,
      userId,
      conversationId,
    );

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

    const membership = await this.conversationRoomService.leave(
      client,
      userId,
      conversationId,
    );

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

  private requireConversationId(
    payload: ConversationRoomDto,
  ): string {
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
EOF

    cat > "${REALTIME_ROOT}/realtime.module.ts" <<'EOF'
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { WebSocketAuthService } from './auth/websocket-auth.service';
import { RealtimeGateway } from './gateway/realtime.gateway';
import { PresenceRegistry } from './presence/presence.registry';
import { PresenceService } from './presence/presence.service';
import { ConversationRoomService } from './rooms/conversation-room.service';
import { RealtimeService } from './services/realtime.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  providers: [
    RealtimeGateway,
    RealtimeService,
    PresenceRegistry,
    PresenceService,
    WebSocketAuthService,
    ConversationRoomService,
  ],
  exports: [
    RealtimeGateway,
    RealtimeService,
    PresenceRegistry,
    PresenceService,
    WebSocketAuthService,
    ConversationRoomService,
  ],
})
export class RealtimeModule {}
EOF

    rm -f "${REALTIME_ROOT}/rooms/.gitkeep"
    rm -f "${REALTIME_ROOT}/dto/.gitkeep"

    echo "Authenticated conversation room management created."
}


build_realtime_activity_events() {

    local REALTIME_ROOT="${ROOT}/services/api/src/realtime"

    echo "Building realtime heartbeat and typing activity events..."

    mkdir -p \
      "${REALTIME_ROOT}/activity" \
      "${REALTIME_ROOT}/dto" \
      "${REALTIME_ROOT}/interfaces"

    cat > "${REALTIME_ROOT}/dto/typing-event.dto.ts" <<'EOF'
export interface TypingEventDto {
  conversationId: string;
}
EOF

    cat > "${REALTIME_ROOT}/interfaces/typing-state.interface.ts" <<'EOF'
export interface TypingState {
  conversationId: string;
  userId: string;
  socketId: string;
  typing: boolean;
  changedAt: string;
}
EOF

    cat > "${REALTIME_ROOT}/interfaces/heartbeat-state.interface.ts" <<'EOF'
export interface HeartbeatState {
  socketId: string;
  userId: string;
  clientTimestamp?: string;
  acknowledgedAt: string;
}
EOF

    cat > "${REALTIME_ROOT}/activity/typing.service.ts" <<'EOF'
import { Injectable } from '@nestjs/common';

import type { TypingState } from '../interfaces/typing-state.interface';

@Injectable()
export class TypingService {
  private readonly timeoutMilliseconds = 5_000;

  private readonly activeTyping = new Map<
    string,
    {
      state: TypingState;
      timeout: ReturnType<typeof setTimeout>;
    }
  >();

  start(
    conversationId: string,
    userId: string,
    socketId: string,
    onTimeout: (state: TypingState) => void,
  ): TypingState {
    const key = this.createKey(conversationId, socketId);
    const existing = this.activeTyping.get(key);

    if (existing) {
      clearTimeout(existing.timeout);
    }

    const state: TypingState = {
      conversationId,
      userId,
      socketId,
      typing: true,
      changedAt: new Date().toISOString(),
    };

    const timeout = setTimeout(() => {
      const stoppedState = this.stop(conversationId, socketId);

      if (stoppedState) {
        onTimeout(stoppedState);
      }
    }, this.timeoutMilliseconds);

    this.activeTyping.set(key, {
      state,
      timeout,
    });

    return state;
  }

  stop(
    conversationId: string,
    socketId: string,
  ): TypingState | null {
    const key = this.createKey(conversationId, socketId);
    const existing = this.activeTyping.get(key);

    if (!existing) {
      return null;
    }

    clearTimeout(existing.timeout);
    this.activeTyping.delete(key);

    return {
      ...existing.state,
      typing: false,
      changedAt: new Date().toISOString(),
    };
  }

  stopAllForSocket(socketId: string): TypingState[] {
    const stoppedStates: TypingState[] = [];

    for (const [key, entry] of this.activeTyping.entries()) {
      if (entry.state.socketId !== socketId) {
        continue;
      }

      clearTimeout(entry.timeout);
      this.activeTyping.delete(key);

      stoppedStates.push({
        ...entry.state,
        typing: false,
        changedAt: new Date().toISOString(),
      });
    }

    return stoppedStates;
  }

  private createKey(
    conversationId: string,
    socketId: string,
  ): string {
    return `${conversationId}:${socketId}`;
  }
}
EOF

    cat > "${REALTIME_ROOT}/gateway/realtime.gateway.ts" <<'EOF'
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

import { TypingService } from '../activity/typing.service';
import { WebSocketAuthService } from '../auth/websocket-auth.service';
import { RealtimeEvents } from '../constants/realtime-events.constant';
import type { ConversationRoomDto } from '../dto/conversation-room.dto';
import type { TypingEventDto } from '../dto/typing-event.dto';
import type { HeartbeatState } from '../interfaces/heartbeat-state.interface';
import type { RealtimeSocketData } from '../interfaces/realtime-socket-data.interface';
import type { RoomMembership } from '../interfaces/room-membership.interface';
import type { TypingState } from '../interfaces/typing-state.interface';
import { PresenceService } from '../presence/presence.service';
import { ConversationRoomService } from '../rooms/conversation-room.service';
import { RoomNameFactory } from '../rooms/room-name.factory';
import { RealtimeService } from '../services/realtime.service';

interface RealtimeEnvelope<T> {
  eventId: string;
  occurredAt: string;
  data: T;
}

interface HeartbeatDto {
  clientTimestamp?: string;
}

interface ClientToServerEvents {
  heartbeat: (
    payload?: HeartbeatDto,
    acknowledgement?: (
      response: RealtimeEnvelope<HeartbeatState>,
    ) => void,
  ) => void;

  'room.join': (
    payload: ConversationRoomDto,
    acknowledgement?: (
      response: RealtimeEnvelope<RoomMembership>,
    ) => void,
  ) => void;

  'room.leave': (
    payload: ConversationRoomDto,
    acknowledgement?: (
      response: RealtimeEnvelope<RoomMembership>,
    ) => void,
  ) => void;

  'typing.start': (
    payload: TypingEventDto,
    acknowledgement?: (
      response: RealtimeEnvelope<TypingState>,
    ) => void,
  ) => void;

  'typing.stop': (
    payload: TypingEventDto,
    acknowledgement?: (
      response: RealtimeEnvelope<TypingState>,
    ) => void,
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

  'heartbeat.acknowledged': (
    payload: RealtimeEnvelope<HeartbeatState>,
  ) => void;

  'room.joined': (
    payload: RealtimeEnvelope<RoomMembership>,
  ) => void;

  'room.left': (
    payload: RealtimeEnvelope<RoomMembership>,
  ) => void;

  'typing.start': (
    payload: RealtimeEnvelope<TypingState>,
  ) => void;

  'typing.stop': (
    payload: RealtimeEnvelope<TypingState>,
  ) => void;
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
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    RealtimeSocketData
  >;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly realtimeService: RealtimeService,
    private readonly presenceService: PresenceService,
    private readonly websocketAuthService: WebSocketAuthService,
    private readonly conversationRoomService: ConversationRoomService,
    private readonly typingService: TypingService,
  ) {}

  afterInit(
    server: Server<
      ClientToServerEvents,
      ServerToClientEvents,
      Record<string, never>,
      RealtimeSocketData
    >,
  ): void {
    this.realtimeService.setServer(server);
    this.logger.log('Realtime gateway initialised');
  }

  async handleConnection(client: RealtimeSocket): Promise<void> {
    try {
      const authentication =
        await this.websocketAuthService.authenticate(client);

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

      this.logger.log(
        `Authenticated realtime client connected: ${userId} (${client.id})`,
      );
    } catch {
      this.logger.warn(
        `Rejected unauthenticated realtime connection ${client.id}`,
      );

      client.disconnect(true);
    }
  }

  handleDisconnect(client: RealtimeSocket): void {
    const stoppedTypingStates =
      this.typingService.stopAllForSocket(client.id);

    for (const state of stoppedTypingStates) {
      this.broadcastTypingState(
        client,
        RealtimeEvents.TYPING_STOP,
        state,
      );
    }

    const presence = this.presenceService.disconnect(client.id);

    if (!presence) {
      this.logger.debug(
        `Realtime client disconnected without presence record: ${client.id}`,
      );
      return;
    }

    this.logger.log(
      `Realtime client disconnected: ${presence.userId} (${client.id})`,
    );
  }

  @SubscribeMessage(RealtimeEvents.HEARTBEAT)
  heartbeat(
    @ConnectedSocket() client: RealtimeSocket,
    @MessageBody() payload?: HeartbeatDto,
  ): RealtimeEnvelope<HeartbeatState> {
    const userId = this.requireAuthenticatedUserId(client);

    const heartbeatState: HeartbeatState = {
      socketId: client.id,
      userId,
      acknowledgedAt: new Date().toISOString(),
      ...(payload?.clientTimestamp
        ? { clientTimestamp: payload.clientTimestamp }
        : {}),
    };

    const envelope =
      this.createEnvelope<HeartbeatState>(heartbeatState);

    client.emit(
      RealtimeEvents.HEARTBEAT_ACKNOWLEDGED,
      envelope,
    );

    return envelope;
  }

  @SubscribeMessage(RealtimeEvents.ROOM_JOIN)
  async joinConversationRoom(
    @ConnectedSocket() client: RealtimeSocket,
    @MessageBody() payload: ConversationRoomDto,
  ): Promise<RealtimeEnvelope<RoomMembership>> {
    const userId = this.requireAuthenticatedUserId(client);
    const conversationId = this.requireConversationId(payload);

    const membership = await this.conversationRoomService.join(
      client,
      userId,
      conversationId,
    );

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

    const stoppedTyping = this.typingService.stop(
      conversationId,
      client.id,
    );

    if (stoppedTyping) {
      this.broadcastTypingState(
        client,
        RealtimeEvents.TYPING_STOP,
        stoppedTyping,
      );
    }

    const membership = await this.conversationRoomService.leave(
      client,
      userId,
      conversationId,
    );

    const envelope = this.createEnvelope(membership);

    client.emit(RealtimeEvents.ROOM_LEFT, envelope);

    return envelope;
  }

  @SubscribeMessage(RealtimeEvents.TYPING_START)
  typingStart(
    @ConnectedSocket() client: RealtimeSocket,
    @MessageBody() payload: TypingEventDto,
  ): RealtimeEnvelope<TypingState> {
    const userId = this.requireAuthenticatedUserId(client);
    const conversationId = this.requireConversationId(payload);

    this.requireConversationRoom(client, conversationId);

    const state = this.typingService.start(
      conversationId,
      userId,
      client.id,
      (timedOutState) => {
        this.broadcastTypingState(
          client,
          RealtimeEvents.TYPING_STOP,
          timedOutState,
        );
      },
    );

    const envelope = this.createEnvelope(state);

    client
      .to(RoomNameFactory.conversation(conversationId))
      .emit(RealtimeEvents.TYPING_START, envelope);

    return envelope;
  }

  @SubscribeMessage(RealtimeEvents.TYPING_STOP)
  typingStop(
    @ConnectedSocket() client: RealtimeSocket,
    @MessageBody() payload: TypingEventDto,
  ): RealtimeEnvelope<TypingState> {
    const userId = this.requireAuthenticatedUserId(client);
    const conversationId = this.requireConversationId(payload);

    this.requireConversationRoom(client, conversationId);

    const state =
      this.typingService.stop(conversationId, client.id) ?? {
        conversationId,
        userId,
        socketId: client.id,
        typing: false,
        changedAt: new Date().toISOString(),
      };

    const envelope = this.createEnvelope(state);

    client
      .to(RoomNameFactory.conversation(conversationId))
      .emit(RealtimeEvents.TYPING_STOP, envelope);

    return envelope;
  }

  private broadcastTypingState(
    client: RealtimeSocket,
    event:
      | typeof RealtimeEvents.TYPING_START
      | typeof RealtimeEvents.TYPING_STOP,
    state: TypingState,
  ): void {
    client
      .to(RoomNameFactory.conversation(state.conversationId))
      .emit(event, this.createEnvelope(state));
  }

  private requireAuthenticatedUserId(
    client: RealtimeSocket,
  ): string {
    const userId = client.data.userId;

    if (!userId) {
      throw new WsException(
        'The realtime connection is not authenticated.',
      );
    }

    return userId;
  }

  private requireConversationId(
    payload: ConversationRoomDto | TypingEventDto,
  ): string {
    const conversationId = payload?.conversationId?.trim();

    if (!conversationId) {
      throw new WsException('A conversationId is required.');
    }

    return conversationId;
  }

  private requireConversationRoom(
    client: RealtimeSocket,
    conversationId: string,
  ): void {
    const roomName =
      RoomNameFactory.conversation(conversationId);

    if (!client.rooms.has(roomName)) {
      throw new WsException(
        'Join the conversation room before sending activity events.',
      );
    }
  }

  private createEnvelope<T>(
    data: T,
  ): RealtimeEnvelope<T> {
    return {
      eventId: randomUUID(),
      occurredAt: new Date().toISOString(),
      data,
    };
  }
}
EOF

    cat > "${REALTIME_ROOT}/realtime.module.ts" <<'EOF'
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { TypingService } from './activity/typing.service';
import { WebSocketAuthService } from './auth/websocket-auth.service';
import { RealtimeGateway } from './gateway/realtime.gateway';
import { PresenceRegistry } from './presence/presence.registry';
import { PresenceService } from './presence/presence.service';
import { ConversationRoomService } from './rooms/conversation-room.service';
import { RealtimeService } from './services/realtime.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  providers: [
    RealtimeGateway,
    RealtimeService,
    PresenceRegistry,
    PresenceService,
    WebSocketAuthService,
    ConversationRoomService,
    TypingService,
  ],
  exports: [
    RealtimeGateway,
    RealtimeService,
    PresenceRegistry,
    PresenceService,
    WebSocketAuthService,
    ConversationRoomService,
    TypingService,
  ],
})
export class RealtimeModule {}
EOF

    rm -f "${REALTIME_ROOT}/activity/.gitkeep"

    echo "Realtime heartbeat and typing activity events created."
}

###############################################################################
# Main
###############################################################################

run_step "[2/12] Install dependencies" install_dependencies
run_step "[3/12] Create folder structure" create_structure
run_step "[4/12] Build gateway" build_gateway
run_step "[5/12] Wire realtime module" wire_realtime_module
run_step "[6/12] Build realtime contracts" build_realtime_contracts
run_step "[7/12] Build presence engine" build_presence_engine
run_step "[8/12] Wire gateway lifecycle" wire_gateway_lifecycle
run_step "[9/12] Build WebSocket authentication" build_websocket_authentication
run_step "[10/12] Build conversation room management" build_conversation_rooms
run_step "[11/12] Build heartbeat and typing events" build_realtime_activity_events

echo
success "Bootstrap foundation completed successfully."
echo

