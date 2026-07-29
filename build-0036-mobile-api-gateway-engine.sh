#!/bin/bash

set -e

echo "🚀 BUILD 0036 — Mobile API Gateway Engine"

cd services/api

mkdir -p src/api
mkdir -p src/mobile
mkdir -p src/session
mkdir -p src/configuration


# =====================================
# API RESPONSE CONTRACT
# =====================================

cat > src/api/api-response.ts <<'TS'
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: Date;
}
TS


cat > src/api/api-version.service.ts <<'TS'
import { Injectable } from '@nestjs/common';


@Injectable()
export class ApiVersionService {

  currentVersion(): string {
    return 'v1';
  }

}
TS


# =====================================
# MOBILE RESPONSE
# =====================================

cat > src/mobile/mobile-response.ts <<'TS'
export interface MobileResponse<T> {
  success: boolean;
  data: T;
  appVersion?: string;
  timestamp: Date;
}
TS


cat > src/mobile/mobile-context.service.ts <<'TS'
import { Injectable } from '@nestjs/common';


@Injectable()
export class MobileContextService {

  createContext(
    userId: string,
    deviceId: string,
  ) {

    return {
      userId,
      deviceId,
      createdAt: new Date(),
    };

  }

}
TS


# =====================================
# SESSION MANAGEMENT
# =====================================

cat > src/session/session.entity.ts <<'TS'
export interface SessionEntity {
  id: string;
  userId: string;
  deviceId: string;
  active: boolean;
  lastActivity: Date;
  createdAt: Date;
}
TS


cat > src/session/session.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { SessionEntity } from './session.entity';


@Injectable()
export class SessionService {

  private sessions:
    SessionEntity[] = [];


  create(
    session: SessionEntity,
  ): SessionEntity {

    this.sessions.push(session);

    return session;
  }


  findByUser(
    userId: string,
  ): SessionEntity[] {

    return this.sessions.filter(
      (item) =>
        item.userId === userId,
    );
  }


  deactivate(
    id: string,
  ): SessionEntity | undefined {

    const session =
      this.sessions.find(
        (item) =>
          item.id === id,
      );

    if (!session) {
      return undefined;
    }

    session.active = false;

    return session;
  }

}
TS


# =====================================
# CONFIGURATION ENGINE
# =====================================

cat > src/configuration/feature-flag.entity.ts <<'TS'
export interface FeatureFlagEntity {
  id: string;
  name: string;
  enabled: boolean;
  createdAt: Date;
}
TS


cat > src/configuration/configuration.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { FeatureFlagEntity } from './feature-flag.entity';


@Injectable()
export class ConfigurationService {

  private flags:
    FeatureFlagEntity[] = [];


  create(
    flag: FeatureFlagEntity,
  ): FeatureFlagEntity {

    this.flags.push(flag);

    return flag;
  }


  enabled(
    name: string,
  ): boolean {

    return this.flags.some(
      (flag) =>
        flag.name === name &&
        flag.enabled,
    );
  }

}
TS


# =====================================
# TEST
# =====================================

mkdir -p test/mobile

cat > test/mobile/mobile-context.service.test.ts <<'TS'
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { MobileContextService } from '../../src/mobile/mobile-context.service';


describe('MobileContextService', () => {

  it('creates mobile context', () => {

    const service =
      new MobileContextService();


    const result =
      service.createContext(
        'user-1',
        'device-1',
      );


    assert.equal(
      result.userId,
      'user-1',
    );

  });

});
TS


cd ../..

pnpm exec prettier --write .
pnpm --filter @neighbour/api run lint
pnpm --filter @neighbour/api run test
pnpm --filter @neighbour/api run build

echo "🎉 BUILD 0036 COMPLETE"

