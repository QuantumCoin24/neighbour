#!/usr/bin/env bash
set -euo pipefail

echo "Building Neighbour™ Build 0003 — PostgreSQL and Prisma foundation..."

if [[ ! -f "pnpm-workspace.yaml" || ! -d "services/api" ]]; then
  echo "ERROR: Run this script from the Neighbour repository root."
  exit 1
fi

echo "Installing Prisma and PostgreSQL dependencies..."
pnpm --filter @neighbour/api add @prisma/client @prisma/adapter-pg pg
pnpm --filter @neighbour/api add -D prisma @types/pg

mkdir -p \
  services/api/prisma \
  services/api/src/database \
  services/api/src/generated \
  services/api/test \
  docs/architecture

cat > services/api/prisma/schema.prisma <<'EOF'
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  DELETED
}

enum CommunityVisibility {
  PUBLIC
  PRIVATE
}

enum MembershipRole {
  OWNER
  ADMIN
  MODERATOR
  MEMBER
}

enum MembershipStatus {
  ACTIVE
  INVITED
  BLOCKED
  LEFT
}

model User {
  id          String       @id @default(uuid()) @db.Uuid
  email       String       @unique
  displayName String
  status      UserStatus   @default(ACTIVE)
  memberships Membership[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([status])
  @@map("users")
}

model Community {
  id          String              @id @default(uuid()) @db.Uuid
  name        String
  slug        String              @unique
  description String?
  visibility  CommunityVisibility @default(PUBLIC)
  memberships Membership[]
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt

  @@index([visibility])
  @@map("communities")
}

model Membership {
  id          String           @id @default(uuid()) @db.Uuid
  userId      String           @db.Uuid
  communityId String           @db.Uuid
  role        MembershipRole   @default(MEMBER)
  status      MembershipStatus @default(ACTIVE)
  joinedAt    DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  community   Community        @relation(fields: [communityId], references: [id], onDelete: Cascade)

  @@unique([userId, communityId])
  @@index([communityId, status])
  @@index([userId, status])
  @@map("memberships")
}
EOF

cat > services/api/prisma.config.ts <<'EOF'
import 'dotenv/config';

import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
EOF

cat > services/api/prisma/seed.ts <<'EOF'
import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client.js';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to seed the database.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function main(): Promise<void> {
  const user = await prisma.user.upsert({
    where: { email: 'founder@neighbour.local' },
    update: {},
    create: {
      email: 'founder@neighbour.local',
      displayName: 'Neighbour Founder',
    },
  });

  const community = await prisma.community.upsert({
    where: { slug: 'neighbour-foundation' },
    update: {},
    create: {
      name: 'Neighbour Foundation',
      slug: 'neighbour-foundation',
      description: 'Initial seeded community for local development.',
      visibility: 'PRIVATE',
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_communityId: {
        userId: user.id,
        communityId: community.id,
      },
    },
    update: {
      role: 'OWNER',
      status: 'ACTIVE',
    },
    create: {
      userId: user.id,
      communityId: community.id,
      role: 'OWNER',
      status: 'ACTIVE',
    },
  });

  console.log('Neighbour database seed completed.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
EOF

cat > services/api/src/database/database.service.ts <<'EOF'
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class DatabaseService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required.');
    }

    super({
      adapter: new PrismaPg({ connectionString: databaseUrl }),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  async ping(): Promise<boolean> {
    await this.$queryRaw`SELECT 1`;
    return true;
  }
}
EOF

cat > services/api/src/database/database.module.ts <<'EOF'
import { Global, Module } from '@nestjs/common';

import { DatabaseService } from './database.service';

@Global()
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
EOF

cat > services/api/src/database/database-health.service.ts <<'EOF'
import { Inject, Injectable } from '@nestjs/common';

import { DatabaseService } from './database.service';

export interface DatabaseHealthResponse {
  database: 'postgresql';
  status: 'ok';
  timestamp: string;
}

@Injectable()
export class DatabaseHealthService {
  constructor(
    @Inject(DatabaseService)
    private readonly database: DatabaseService,
  ) {}

  async getHealth(): Promise<DatabaseHealthResponse> {
    await this.database.ping();

    return {
      database: 'postgresql',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
EOF

cat > services/api/src/database/database-health.controller.ts <<'EOF'
import { Controller, Get, Inject } from '@nestjs/common';

import type { DatabaseHealthResponse } from './database-health.service';
import { DatabaseHealthService } from './database-health.service';

@Controller('health/database')
export class DatabaseHealthController {
  constructor(
    @Inject(DatabaseHealthService)
    private readonly databaseHealthService: DatabaseHealthService,
  ) {}

  @Get()
  getHealth(): Promise<DatabaseHealthResponse> {
    return this.databaseHealthService.getHealth();
  }
}
EOF

cat > services/api/src/database/database-health.module.ts <<'EOF'
import { Module } from '@nestjs/common';

import { DatabaseHealthController } from './database-health.controller';
import { DatabaseHealthService } from './database-health.service';

@Module({
  controllers: [DatabaseHealthController],
  providers: [DatabaseHealthService],
})
export class DatabaseHealthModule {}
EOF

cat > services/api/src/app.module.ts <<'EOF'
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { environment } from './config/environment';
import { environmentValidationSchema } from './config/environment.validation';
import { DatabaseHealthModule } from './database/database-health.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [environment],
      validationSchema: environmentValidationSchema,
    }),
    DatabaseModule,
    HealthModule,
    DatabaseHealthModule,
  ],
})
export class AppModule {}
EOF

cat > services/api/src/config/environment.ts <<'EOF'
export interface Environment {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  appVersion: string;
}

export const environment = (): Environment => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number.parseInt(process.env.PORT ?? '4000', 10),
  databaseUrl: process.env.DATABASE_URL ?? '',
  appVersion: process.env.APP_VERSION ?? '1.0.0-alpha.3',
});
EOF

cat > services/api/src/config/environment.validation.ts <<'EOF'
import Joi from 'joi';

export const environmentValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(4000),
  APP_VERSION: Joi.string().default('1.0.0-alpha.3'),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required(),
});
EOF

cat > services/api/test/database-health.service.test.ts <<'EOF'
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DatabaseHealthService } from '../src/database/database-health.service';
import type { DatabaseService } from '../src/database/database.service';

describe('DatabaseHealthService', () => {
  it('returns a healthy PostgreSQL payload after a successful ping', async () => {
    const database = {
      ping: async (): Promise<boolean> => true,
    } as DatabaseService;

    const service = new DatabaseHealthService(database);
    const response = await service.getHealth();

    assert.equal(response.database, 'postgresql');
    assert.equal(response.status, 'ok');
    assert.ok(response.timestamp);
  });
});
EOF

cat > docker-compose.yml <<'EOF'
services:
  postgres:
    image: postgres:17-alpine
    container_name: neighbour-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: neighbour
      POSTGRES_USER: neighbour
      POSTGRES_PASSWORD: neighbour_local_password
    ports:
      - "5432:5432"
    volumes:
      - neighbour_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U neighbour -d neighbour"]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 5s

volumes:
  neighbour_postgres_data:
EOF

cat > .env.example <<'EOF'
NODE_ENV=development
PORT=4000
APP_VERSION=1.0.0-alpha.3
DATABASE_URL=postgresql://neighbour:neighbour_local_password@localhost:5432/neighbour?schema=public
EOF

if [[ ! -f ".env" ]]; then
  cp .env.example .env
  echo "Created local .env from .env.example"
fi

node <<'EOF'
const fs = require('node:fs');

const path = 'services/api/package.json';
const packageJson = JSON.parse(fs.readFileSync(path, 'utf8'));

packageJson.scripts = {
  ...packageJson.scripts,
  'db:generate': 'prisma generate',
  'db:migrate': 'prisma migrate dev',
  'db:deploy': 'prisma migrate deploy',
  'db:seed': 'prisma db seed',
  'db:studio': 'prisma studio',
  'db:validate': 'prisma validate',
};

fs.writeFileSync(path, `${JSON.stringify(packageJson, null, 2)}\n`);
EOF

cat > docs/architecture/0003-database-foundation.md <<'EOF'
# Architecture Decision 0003 — Database Foundation

## Status

Accepted.

## Decision

Neighbour™ uses PostgreSQL as its primary relational data store and Prisma ORM as
its type-safe database access layer.

The initial domain establishes:

- users;
- communities;
- memberships;
- membership roles and lifecycle states.

A membership is unique for each user/community pair. Foreign-key deletion uses
cascading behaviour so orphaned memberships cannot remain.

## Local development

PostgreSQL runs through Docker Compose. Prisma migrations are committed to source
control and are the authoritative record of schema evolution.

## Runtime integration

`DatabaseService` owns the Prisma client lifecycle and is exported globally
through `DatabaseModule`.

The endpoint:

`GET /api/v1/health/database`

performs a live database query and reports PostgreSQL availability.

## Security boundary

The local password in `.env.example` is development-only. Production credentials
must be injected through the deployment platform and must never be committed.
EOF

echo "Generating Prisma client..."
pnpm --filter @neighbour/api db:generate

echo "Formatting repository..."
pnpm format

echo "Running repository checks..."
pnpm check

echo
echo "Build 0003 source foundation completed."
echo

if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  echo "Starting PostgreSQL..."
  docker compose up -d postgres

  echo "Waiting for PostgreSQL health check..."
  for attempt in {1..30}; do
    status="$(docker inspect --format='{{.State.Health.Status}}' neighbour-postgres 2>/dev/null || true)"
    if [[ "$status" == "healthy" ]]; then
      break
    fi
    sleep 2
  done

  status="$(docker inspect --format='{{.State.Health.Status}}' neighbour-postgres 2>/dev/null || true)"
  if [[ "$status" != "healthy" ]]; then
    echo "ERROR: PostgreSQL did not become healthy."
    docker compose logs postgres
    exit 1
  fi

  echo "Creating initial migration..."
  pnpm --filter @neighbour/api exec prisma migrate dev --name init_neighbour_core

  echo "Seeding database..."
  pnpm --filter @neighbour/api db:seed

  echo
  echo "Build 0003 database foundation is operational."
  echo "Start the API with:"
  echo "  pnpm --filter @neighbour/api dev"
  echo
  echo "Then test:"
  echo "  curl http://localhost:4000/api/v1/health"
  echo "  curl http://localhost:4000/api/v1/health/database"
else
  echo "Docker is not running, so migration and seed were not executed."
  echo "Start Docker Desktop, then run:"
  echo "  docker compose up -d postgres"
  echo "  pnpm --filter @neighbour/api exec prisma migrate dev --name init_neighbour_core"
  echo "  pnpm --filter @neighbour/api db:seed"
fi
