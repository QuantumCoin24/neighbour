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
###############################################################################
# Main
###############################################################################

run_step "[2/12] Install dependencies" install_dependencies
run_step "[3/12] Create folder structure" create_structure
run_step "[4/12] Build gateway" build_gateway
run_step "[5/12] Wire realtime module" wire_realtime_module
run_step "[6/12] Build realtime contracts" build_realtime_contracts

echo
success "Bootstrap foundation completed successfully."
echo

