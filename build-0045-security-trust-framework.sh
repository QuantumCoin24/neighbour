#!/bin/bash

set -e

echo "🚀 BUILD 0045 — Security Trust Framework"

cd services/api

mkdir -p src/security/permissions
mkdir -p src/security/access
mkdir -p src/security/sessions
mkdir -p src/security/trust


cat > src/security/permissions/permission.entity.ts <<'TS'
export interface PermissionEntity {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
}
TS


cat > src/security/permissions/permission.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { PermissionEntity } from './permission.entity';


@Injectable()
export class PermissionService {

  private permissions: PermissionEntity[] = [];


  create(
    permission: PermissionEntity,
  ): PermissionEntity {

    this.permissions.push(permission);

    return permission;
  }


  list(): PermissionEntity[] {
    return this.permissions;
  }

}
TS


cat > src/security/access/access-policy.entity.ts <<'TS'
export interface AccessPolicyEntity {
  id: string;
  role: string;
  permission: string;
  enabled: boolean;
}
TS


cat > src/security/access/access-policy.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { AccessPolicyEntity } from './access-policy.entity';


@Injectable()
export class AccessPolicyService {

  private policies: AccessPolicyEntity[] = [];


  create(
    policy: AccessPolicyEntity,
  ): AccessPolicyEntity {

    this.policies.push(policy);

    return policy;
  }


  list(): AccessPolicyEntity[] {
    return this.policies;
  }

}
TS


cat > src/security/sessions/session.entity.ts <<'TS'
export interface SessionEntity {
  id: string;
  userId: string;
  active: boolean;
  createdAt: Date;
}
TS


cat > src/security/sessions/session.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { SessionEntity } from './session.entity';


@Injectable()
export class SessionService {

  private sessions: SessionEntity[] = [];


  create(
    session: SessionEntity,
  ): SessionEntity {

    this.sessions.push(session);

    return session;
  }


  list(): SessionEntity[] {
    return this.sessions;
  }

}
TS


cat > src/security/trust/trust-score.entity.ts <<'TS'
export interface TrustScoreEntity {
  userId: string;
  score: number;
  updatedAt: Date;
}
TS


cat > src/security/trust/trust.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { TrustScoreEntity } from './trust-score.entity';


@Injectable()
export class TrustService {

  calculate(
    userId: string,
    score: number,
  ): TrustScoreEntity {

    return {
      userId,
      score,
      updatedAt: new Date(),
    };

  }

}
TS


mkdir -p test/security

cat > test/security/trust.service.test.ts <<'TS'
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { TrustService } from '../../src/security/trust/trust.service';


describe('TrustService', () => {

  it('creates a trust score', () => {

    const service = new TrustService();

    const result =
      service.calculate(
        'user-1',
        80,
      );


    assert.equal(
      result.score,
      80,
    );

  });

});
TS


cd ../..

rm -rf services/api/dist

pnpm --filter @neighbour/api run lint
pnpm --filter @neighbour/api run test
pnpm --filter @neighbour/api run build

echo "🎉 BUILD 0045 COMPLETE"

