#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="${HOME}/Documents/neighbour"

cd "${PROJECT_ROOT}"

echo "Building Neighbour™ Build 0007 — Social Graph and Neighbour Connections..."

mkdir -p services/api/src/social-graph/interfaces
mkdir -p services/api/src/social-graph/utils
mkdir -p services/api/test
mkdir -p docs/architecture

echo "Extending Prisma schema..."

python3 - <<'PY'
from pathlib import Path

path = Path("services/api/prisma/schema.prisma")
text = path.read_text()

if "enum ConnectionStatus" not in text:
    anchor = """enum MembershipStatus {
  ACTIVE
  INVITED
  BLOCKED
  LEFT
}
"""

    addition = """
enum ConnectionStatus {
  PENDING
  CONNECTED
  DECLINED
}
"""

    if anchor not in text:
        raise SystemExit("Could not locate MembershipStatus enum.")

    text = text.replace(anchor, anchor + addition)

old_user_relations = """  memberships     Membership[]
  profile         UserProfile?
  refreshTokens   RefreshToken[]
"""

new_user_relations = """  memberships            Membership[]
  profile                UserProfile?
  refreshTokens          RefreshToken[]
  connectionsAsUserA     Connection[]  @relation("ConnectionUserA")
  connectionsAsUserB     Connection[]  @relation("ConnectionUserB")
  requestedConnections   Connection[]  @relation("ConnectionRequester")
  blocksCreated          UserBlock[]   @relation("Blocker")
  blocksReceived         UserBlock[]   @relation("Blocked")
"""

if "connectionsAsUserA" not in text:
    if old_user_relations not in text:
        raise SystemExit("Could not locate User relation fields.")

    text = text.replace(old_user_relations, new_user_relations)

if "model Connection {" not in text:
    connection_models = """

model Connection {
  id            String           @id @default(uuid()) @db.Uuid
  userAId       String           @db.Uuid
  userBId       String           @db.Uuid
  requestedById String           @db.Uuid
  status        ConnectionStatus @default(PENDING)
  respondedAt   DateTime?
  connectedAt   DateTime?
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt
  userA         User             @relation("ConnectionUserA", fields: [userAId], references: [id], onDelete: Cascade)
  userB         User             @relation("ConnectionUserB", fields: [userBId], references: [id], onDelete: Cascade)
  requestedBy   User             @relation("ConnectionRequester", fields: [requestedById], references: [id], onDelete: Cascade)

  @@unique([userAId, userBId])
  @@index([userAId, status])
  @@index([userBId, status])
  @@index([requestedById, status])
  @@map("connections")
}

model UserBlock {
  id        String   @id @default(uuid()) @db.Uuid
  blockerId String   @db.Uuid
  blockedId String   @db.Uuid
  createdAt DateTime @default(now())
  blocker   User     @relation("Blocker", fields: [blockerId], references: [id], onDelete: Cascade)
  blocked   User     @relation("Blocked", fields: [blockedId], references: [id], onDelete: Cascade)

  @@unique([blockerId, blockedId])
  @@index([blockerId])
  @@index([blockedId])
  @@map("user_blocks")
}
"""

    text = text.rstrip() + connection_models + "\n"

path.write_text(text)
PY

echo "Creating social graph utilities..."

cat > services/api/src/social-graph/utils/connection-pair.util.ts <<'EOF'
export interface ConnectionPair {
  userAId: string;
  userBId: string;
}

export function createConnectionPair(firstUserId: string, secondUserId: string): ConnectionPair {
  if (firstUserId === secondUserId) {
    throw new Error('A user cannot form a connection pair with themselves.');
  }

  return firstUserId.localeCompare(secondUserId) < 0
    ? {
        userAId: firstUserId,
        userBId: secondUserId,
      }
    : {
        userAId: secondUserId,
        userBId: firstUserId,
      };
}

export function getOtherUserId(
  currentUserId: string,
  pair: ConnectionPair,
): string {
  if (pair.userAId === currentUserId) {
    return pair.userBId;
  }

  if (pair.userBId === currentUserId) {
    return pair.userAId;
  }

  throw new Error('The current user does not belong to this connection pair.');
}
EOF

cat > services/api/src/social-graph/interfaces/social-graph-response.interface.ts <<'EOF'
export type RelationshipStatus =
  | 'NONE'
  | 'OUTGOING_REQUEST'
  | 'INCOMING_REQUEST'
  | 'CONNECTED'
  | 'BLOCKED_BY_ME'
  | 'BLOCKED_ME';

export interface ConnectionProfileSummary {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  localArea: string | null;
}

export interface ConnectionResponse {
  id: string;
  status: 'PENDING' | 'CONNECTED' | 'DECLINED';
  direction: 'INCOMING' | 'OUTGOING' | 'CONNECTED';
  user: ConnectionProfileSummary;
  createdAt: Date;
  updatedAt: Date;
  connectedAt: Date | null;
}

export interface RelationshipStatusResponse {
  userId: string;
  status: RelationshipStatus;
  connectionId: string | null;
}

export interface BlockResponse {
  blocked: boolean;
  userId: string;
}
EOF

echo "Creating social graph service..."

cat > services/api/src/social-graph/social-graph.service.ts <<'EOF'
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import type {
  ConnectionResponse,
  ConnectionProfileSummary,
  RelationshipStatusResponse,
  BlockResponse,
} from './interfaces/social-graph-response.interface';
import { createConnectionPair } from './utils/connection-pair.util';

const connectionUserInclude = {
  userA: {
    include: {
      profile: true,
    },
  },
  userB: {
    include: {
      profile: true,
    },
  },
} as const;

type ConnectionWithUsers = Awaited<
  ReturnType<DatabaseService['connection']['findFirst']>
> & {
  userA?: {
    id: string;
    displayName: string;
    profile: {
      username: string;
      avatarUrl: string | null;
      localArea: string | null;
      showLocalArea: boolean;
    } | null;
  };
  userB?: {
    id: string;
    displayName: string;
    profile: {
      username: string;
      avatarUrl: string | null;
      localArea: string | null;
      showLocalArea: boolean;
    } | null;
  };
};

@Injectable()
export class SocialGraphService {
  constructor(
    @Inject(DatabaseService)
    private readonly database: DatabaseService,
  ) {}

  async sendRequest(
    currentUserId: string,
    targetUserId: string,
  ): Promise<ConnectionResponse> {
    this.assertDifferentUsers(currentUserId, targetUserId);

    await this.requireActiveUser(targetUserId);
    await this.assertNotBlockedEitherDirection(currentUserId, targetUserId);

    const pair = createConnectionPair(currentUserId, targetUserId);

    const existing = await this.database.connection.findUnique({
      where: {
        userAId_userBId: pair,
      },
      include: connectionUserInclude,
    });

    if (existing?.status === 'CONNECTED') {
      throw new ConflictException('You are already connected to this user.');
    }

    if (existing?.status === 'PENDING') {
      if (existing.requestedById === currentUserId) {
        throw new ConflictException('A connection request has already been sent.');
      }

      throw new ConflictException(
        'This user has already sent you a connection request.',
      );
    }

    const connection = existing
      ? await this.database.connection.update({
          where: {
            id: existing.id,
          },
          data: {
            requestedById: currentUserId,
            status: 'PENDING',
            respondedAt: null,
            connectedAt: null,
          },
          include: connectionUserInclude,
        })
      : await this.database.connection.create({
          data: {
            ...pair,
            requestedById: currentUserId,
            status: 'PENDING',
          },
          include: connectionUserInclude,
        });

    return this.toConnectionResponse(connection, currentUserId);
  }

  async acceptRequest(
    currentUserId: string,
    connectionId: string,
  ): Promise<ConnectionResponse> {
    const connection = await this.requireConnectionForUser(
      currentUserId,
      connectionId,
    );

    if (connection.status !== 'PENDING') {
      throw new ConflictException('This connection request is no longer pending.');
    }

    if (connection.requestedById === currentUserId) {
      throw new ForbiddenException(
        'You cannot accept a connection request that you sent.',
      );
    }

    const otherUserId = this.getOtherUserId(currentUserId, connection);
    await this.assertNotBlockedEitherDirection(currentUserId, otherUserId);

    const accepted = await this.database.connection.update({
      where: {
        id: connectionId,
      },
      data: {
        status: 'CONNECTED',
        respondedAt: new Date(),
        connectedAt: new Date(),
      },
      include: connectionUserInclude,
    });

    return this.toConnectionResponse(accepted, currentUserId);
  }

  async declineRequest(
    currentUserId: string,
    connectionId: string,
  ): Promise<void> {
    const connection = await this.requireConnectionForUser(
      currentUserId,
      connectionId,
    );

    if (connection.status !== 'PENDING') {
      throw new ConflictException('This connection request is no longer pending.');
    }

    if (connection.requestedById === currentUserId) {
      throw new ForbiddenException(
        'Use the cancel endpoint for a request that you sent.',
      );
    }

    await this.database.connection.update({
      where: {
        id: connectionId,
      },
      data: {
        status: 'DECLINED',
        respondedAt: new Date(),
        connectedAt: null,
      },
    });
  }

  async cancelRequest(
    currentUserId: string,
    connectionId: string,
  ): Promise<void> {
    const connection = await this.requireConnectionForUser(
      currentUserId,
      connectionId,
    );

    if (connection.status !== 'PENDING') {
      throw new ConflictException('This connection request is no longer pending.');
    }

    if (connection.requestedById !== currentUserId) {
      throw new ForbiddenException(
        'You cannot cancel a connection request sent by another user.',
      );
    }

    await this.database.connection.delete({
      where: {
        id: connectionId,
      },
    });
  }

  async removeConnection(
    currentUserId: string,
    connectionId: string,
  ): Promise<void> {
    const connection = await this.requireConnectionForUser(
      currentUserId,
      connectionId,
    );

    if (connection.status !== 'CONNECTED') {
      throw new ConflictException('This relationship is not an active connection.');
    }

    await this.database.connection.delete({
      where: {
        id: connectionId,
      },
    });
  }

  async listConnections(currentUserId: string): Promise<ConnectionResponse[]> {
    const connections = await this.database.connection.findMany({
      where: {
        status: 'CONNECTED',
        OR: [{ userAId: currentUserId }, { userBId: currentUserId }],
      },
      include: connectionUserInclude,
      orderBy: {
        connectedAt: 'desc',
      },
    });

    return connections.map((connection) =>
      this.toConnectionResponse(connection, currentUserId),
    );
  }

  async listIncomingRequests(
    currentUserId: string,
  ): Promise<ConnectionResponse[]> {
    const connections = await this.database.connection.findMany({
      where: {
        status: 'PENDING',
        requestedById: {
          not: currentUserId,
        },
        OR: [{ userAId: currentUserId }, { userBId: currentUserId }],
      },
      include: connectionUserInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return connections.map((connection) =>
      this.toConnectionResponse(connection, currentUserId),
    );
  }

  async listOutgoingRequests(
    currentUserId: string,
  ): Promise<ConnectionResponse[]> {
    const connections = await this.database.connection.findMany({
      where: {
        status: 'PENDING',
        requestedById: currentUserId,
      },
      include: connectionUserInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return connections.map((connection) =>
      this.toConnectionResponse(connection, currentUserId),
    );
  }

  async getRelationshipStatus(
    currentUserId: string,
    targetUserId: string,
  ): Promise<RelationshipStatusResponse> {
    this.assertDifferentUsers(currentUserId, targetUserId);

    await this.requireActiveUser(targetUserId);

    const blockedByMe = await this.database.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: currentUserId,
          blockedId: targetUserId,
        },
      },
    });

    if (blockedByMe) {
      return {
        userId: targetUserId,
        status: 'BLOCKED_BY_ME',
        connectionId: null,
      };
    }

    const blockedMe = await this.database.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: targetUserId,
          blockedId: currentUserId,
        },
      },
    });

    if (blockedMe) {
      return {
        userId: targetUserId,
        status: 'BLOCKED_ME',
        connectionId: null,
      };
    }

    const pair = createConnectionPair(currentUserId, targetUserId);

    const connection = await this.database.connection.findUnique({
      where: {
        userAId_userBId: pair,
      },
    });

    if (!connection || connection.status === 'DECLINED') {
      return {
        userId: targetUserId,
        status: 'NONE',
        connectionId: null,
      };
    }

    if (connection.status === 'CONNECTED') {
      return {
        userId: targetUserId,
        status: 'CONNECTED',
        connectionId: connection.id,
      };
    }

    return {
      userId: targetUserId,
      status:
        connection.requestedById === currentUserId
          ? 'OUTGOING_REQUEST'
          : 'INCOMING_REQUEST',
      connectionId: connection.id,
    };
  }

  async blockUser(
    currentUserId: string,
    targetUserId: string,
  ): Promise<BlockResponse> {
    this.assertDifferentUsers(currentUserId, targetUserId);
    await this.requireActiveUser(targetUserId);

    const pair = createConnectionPair(currentUserId, targetUserId);

    await this.database.$transaction([
      this.database.connection.deleteMany({
        where: {
          userAId: pair.userAId,
          userBId: pair.userBId,
        },
      }),
      this.database.userBlock.upsert({
        where: {
          blockerId_blockedId: {
            blockerId: currentUserId,
            blockedId: targetUserId,
          },
        },
        update: {},
        create: {
          blockerId: currentUserId,
          blockedId: targetUserId,
        },
      }),
    ]);

    return {
      blocked: true,
      userId: targetUserId,
    };
  }

  async unblockUser(
    currentUserId: string,
    targetUserId: string,
  ): Promise<BlockResponse> {
    this.assertDifferentUsers(currentUserId, targetUserId);

    await this.database.userBlock.deleteMany({
      where: {
        blockerId: currentUserId,
        blockedId: targetUserId,
      },
    });

    return {
      blocked: false,
      userId: targetUserId,
    };
  }

  private async requireActiveUser(userId: string): Promise<void> {
    const user = await this.database.user.findFirst({
      where: {
        id: userId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }
  }

  private async assertNotBlockedEitherDirection(
    firstUserId: string,
    secondUserId: string,
  ): Promise<void> {
    const block = await this.database.userBlock.findFirst({
      where: {
        OR: [
          {
            blockerId: firstUserId,
            blockedId: secondUserId,
          },
          {
            blockerId: secondUserId,
            blockedId: firstUserId,
          },
        ],
      },
      select: {
        id: true,
      },
    });

    if (block) {
      throw new ForbiddenException(
        'A connection cannot be created between these users.',
      );
    }
  }

  private async requireConnectionForUser(
    currentUserId: string,
    connectionId: string,
  ) {
    const connection = await this.database.connection.findFirst({
      where: {
        id: connectionId,
        OR: [{ userAId: currentUserId }, { userBId: currentUserId }],
      },
      include: connectionUserInclude,
    });

    if (!connection) {
      throw new NotFoundException('Connection not found.');
    }

    return connection;
  }

  private toConnectionResponse(
    connection: NonNullable<ConnectionWithUsers>,
    currentUserId: string,
  ): ConnectionResponse {
    if (!connection.userA || !connection.userB) {
      throw new Error('Connection user data was not loaded.');
    }

    const otherUser =
      connection.userAId === currentUserId
        ? connection.userB
        : connection.userA;

    let direction: ConnectionResponse['direction'] = 'CONNECTED';

    if (connection.status === 'PENDING') {
      direction =
        connection.requestedById === currentUserId
          ? 'OUTGOING'
          : 'INCOMING';
    }

    return {
      id: connection.id,
      status: connection.status,
      direction,
      user: this.toProfileSummary(otherUser),
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt,
      connectedAt: connection.connectedAt,
    };
  }

  private toProfileSummary(user: {
    id: string;
    displayName: string;
    profile: {
      username: string;
      avatarUrl: string | null;
      localArea: string | null;
      showLocalArea: boolean;
    } | null;
  }): ConnectionProfileSummary {
    return {
      id: user.id,
      displayName: user.displayName,
      username: user.profile?.username ?? null,
      avatarUrl: user.profile?.avatarUrl ?? null,
      localArea:
        user.profile?.showLocalArea === true
          ? user.profile.localArea
          : null,
    };
  }

  private getOtherUserId(
    currentUserId: string,
    connection: {
      userAId: string;
      userBId: string;
    },
  ): string {
    return connection.userAId === currentUserId
      ? connection.userBId
      : connection.userAId;
  }

  private assertDifferentUsers(
    currentUserId: string,
    targetUserId: string,
  ): void {
    if (currentUserId === targetUserId) {
      throw new BadRequestException(
        'You cannot perform this action on your own account.',
      );
    }
  }
}
EOF

echo "Creating social graph controller and module..."

cat > services/api/src/social-graph/social-graph.controller.ts <<'EOF'
import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import type {
  BlockResponse,
  ConnectionResponse,
  RelationshipStatusResponse,
} from './interfaces/social-graph-response.interface';
import { SocialGraphService } from './social-graph.service';

@Controller('connections')
export class SocialGraphController {
  constructor(private readonly socialGraphService: SocialGraphService) {}

  @Post('requests/:userId')
  sendRequest(
    @CurrentUser() user: AuthUser,
    @Param('userId') targetUserId: string,
  ): Promise<ConnectionResponse> {
    return this.socialGraphService.sendRequest(user.id, targetUserId);
  }

  @Post(':connectionId/accept')
  acceptRequest(
    @CurrentUser() user: AuthUser,
    @Param('connectionId') connectionId: string,
  ): Promise<ConnectionResponse> {
    return this.socialGraphService.acceptRequest(user.id, connectionId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post(':connectionId/decline')
  declineRequest(
    @CurrentUser() user: AuthUser,
    @Param('connectionId') connectionId: string,
  ): Promise<void> {
    return this.socialGraphService.declineRequest(user.id, connectionId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':connectionId/request')
  cancelRequest(
    @CurrentUser() user: AuthUser,
    @Param('connectionId') connectionId: string,
  ): Promise<void> {
    return this.socialGraphService.cancelRequest(user.id, connectionId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':connectionId')
  removeConnection(
    @CurrentUser() user: AuthUser,
    @Param('connectionId') connectionId: string,
  ): Promise<void> {
    return this.socialGraphService.removeConnection(user.id, connectionId);
  }

  @Get()
  listConnections(
    @CurrentUser() user: AuthUser,
  ): Promise<ConnectionResponse[]> {
    return this.socialGraphService.listConnections(user.id);
  }

  @Get('requests/incoming')
  listIncomingRequests(
    @CurrentUser() user: AuthUser,
  ): Promise<ConnectionResponse[]> {
    return this.socialGraphService.listIncomingRequests(user.id);
  }

  @Get('requests/outgoing')
  listOutgoingRequests(
    @CurrentUser() user: AuthUser,
  ): Promise<ConnectionResponse[]> {
    return this.socialGraphService.listOutgoingRequests(user.id);
  }

  @Get('relationship/:userId')
  getRelationshipStatus(
    @CurrentUser() user: AuthUser,
    @Param('userId') targetUserId: string,
  ): Promise<RelationshipStatusResponse> {
    return this.socialGraphService.getRelationshipStatus(
      user.id,
      targetUserId,
    );
  }

  @Post('blocks/:userId')
  blockUser(
    @CurrentUser() user: AuthUser,
    @Param('userId') targetUserId: string,
  ): Promise<BlockResponse> {
    return this.socialGraphService.blockUser(user.id, targetUserId);
  }

  @Delete('blocks/:userId')
  unblockUser(
    @CurrentUser() user: AuthUser,
    @Param('userId') targetUserId: string,
  ): Promise<BlockResponse> {
    return this.socialGraphService.unblockUser(user.id, targetUserId);
  }
}
EOF

cat > services/api/src/social-graph/social-graph.module.ts <<'EOF'
import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { SocialGraphController } from './social-graph.controller';
import { SocialGraphService } from './social-graph.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SocialGraphController],
  providers: [SocialGraphService],
  exports: [SocialGraphService],
})
export class SocialGraphModule {}
EOF

echo "Registering SocialGraphModule..."

python3 - <<'PY'
from pathlib import Path

path = Path("services/api/src/app.module.ts")
text = path.read_text()

import_line = "import { SocialGraphModule } from './social-graph/social-graph.module';\n"

if import_line not in text:
    anchor = "import { ProfileModule } from './profile/profile.module';\n"

    if anchor not in text:
        raise SystemExit("Could not locate ProfileModule import.")

    text = text.replace(anchor, anchor + import_line)

if "    SocialGraphModule,\n" not in text:
    anchor = "    ProfileModule,\n"

    if anchor not in text:
        raise SystemExit("Could not locate ProfileModule registration.")

    text = text.replace(anchor, anchor + "    SocialGraphModule,\n")

path.write_text(text)
PY

echo "Creating automated tests..."

cat > services/api/test/connection-pair.test.ts <<'EOF'
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createConnectionPair,
  getOtherUserId,
} from '../src/social-graph/utils/connection-pair.util';

describe('connection pair utility', () => {
  it('creates the same canonical pair regardless of input order', () => {
    const first = createConnectionPair('user-b', 'user-a');
    const second = createConnectionPair('user-a', 'user-b');

    assert.deepEqual(first, {
      userAId: 'user-a',
      userBId: 'user-b',
    });

    assert.deepEqual(second, first);
  });

  it('returns the other user in the pair', () => {
    const pair = createConnectionPair('user-a', 'user-b');

    assert.equal(getOtherUserId('user-a', pair), 'user-b');
    assert.equal(getOtherUserId('user-b', pair), 'user-a');
  });

  it('rejects self-connections', () => {
    assert.throws(
      () => createConnectionPair('user-a', 'user-a'),
      /cannot form a connection pair with themselves/,
    );
  });

  it('rejects users who do not belong to the pair', () => {
    const pair = createConnectionPair('user-a', 'user-b');

    assert.throws(
      () => getOtherUserId('user-c', pair),
      /does not belong to this connection pair/,
    );
  });
});
EOF

cat > services/api/test/social-graph-response.test.ts <<'EOF'
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type {
  ConnectionResponse,
  RelationshipStatusResponse,
} from '../src/social-graph/interfaces/social-graph-response.interface';

describe('social graph response contracts', () => {
  it('supports a safe connection response', () => {
    const response: ConnectionResponse = {
      id: 'connection-id',
      status: 'CONNECTED',
      direction: 'CONNECTED',
      user: {
        id: 'user-id',
        displayName: 'Neighbour Member',
        username: 'neighbour-member',
        avatarUrl: null,
        localArea: null,
      },
      createdAt: new Date('2026-07-28T00:00:00.000Z'),
      updatedAt: new Date('2026-07-28T00:00:00.000Z'),
      connectedAt: new Date('2026-07-28T00:00:00.000Z'),
    };

    assert.equal(response.status, 'CONNECTED');
    assert.equal(response.user.username, 'neighbour-member');
    assert.equal(response.user.localArea, null);
  });

  it('supports all relationship status categories', () => {
    const statuses: RelationshipStatusResponse['status'][] = [
      'NONE',
      'OUTGOING_REQUEST',
      'INCOMING_REQUEST',
      'CONNECTED',
      'BLOCKED_BY_ME',
      'BLOCKED_ME',
    ];

    assert.equal(statuses.length, 6);
  });
});
EOF

echo "Creating architecture documentation..."

cat > docs/architecture/0007-social-graph.md <<'EOF'
# Neighbour™ Architecture Decision 0007

## Social Graph and Neighbour Connections

Build 0007 establishes the first version of the Neighbour™ social graph.

## Objectives

The social graph provides a controlled two-way connection relationship between
Neighbour members.

The module supports:

- sending a connection request;
- receiving incoming connection requests;
- viewing outgoing requests;
- accepting a request;
- declining a request;
- cancelling an outgoing request;
- removing an active connection;
- blocking another user;
- unblocking another user;
- retrieving the relationship status between two users;
- listing active connections.

## Canonical relationship pairs

Each connection stores two canonical user identifiers:

- `userAId`;
- `userBId`.

The identifiers are ordered consistently before the database operation is
performed. This allows the database to enforce one connection record per pair
regardless of which member initiated the relationship.

The `requestedById` field records which member initiated the current request.

## Connection states

A connection can be:

- `PENDING`;
- `CONNECTED`;
- `DECLINED`.

Declined records may later be reused when a new valid request is made.

## Blocking

Blocks are stored separately from connections.

A block:

- prevents either member from initiating a connection;
- removes any existing request or active connection between the pair;
- remains directional;
- can only be removed by the member who created it.

## Privacy

Connection responses return only safe public identity information:

- user identifier;
- display name;
- username;
- avatar URL;
- local area only where the user has enabled local-area visibility.

Email addresses, authentication data, account roles and private profile fields
are not returned.

## API routes

All routes require authentication.

### Requests

- `POST /api/v1/connections/requests/:userId`
- `GET /api/v1/connections/requests/incoming`
- `GET /api/v1/connections/requests/outgoing`
- `POST /api/v1/connections/:connectionId/accept`
- `POST /api/v1/connections/:connectionId/decline`
- `DELETE /api/v1/connections/:connectionId/request`

### Connections

- `GET /api/v1/connections`
- `DELETE /api/v1/connections/:connectionId`
- `GET /api/v1/connections/relationship/:userId`

### Blocks

- `POST /api/v1/connections/blocks/:userId`
- `DELETE /api/v1/connections/blocks/:userId`

## Future extensions

This foundation is intended to support:

- mutual-connection counts;
- connection recommendations;
- feed visibility;
- messaging permissions;
- event invitations;
- trusted-neighbour designations;
- community-based discovery;
- moderation and safety controls.
EOF

echo "Formatting Prisma schema..."

pnpm --filter @neighbour/api exec prisma format

echo "Creating and applying social graph migration..."

pnpm --filter @neighbour/api exec prisma migrate dev --name social_graph

echo "Generating Prisma client..."

pnpm --filter @neighbour/api db:generate

echo "Formatting and validating Build 0007..."

pnpm format
pnpm check

echo
echo "Neighbour™ Build 0007 completed successfully."
echo "Social Graph and Neighbour Connections are ready."