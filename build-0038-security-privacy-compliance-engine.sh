#!/bin/bash

set -e

echo "🚀 BUILD 0038 — Security Privacy Compliance Engine"

cd services/api

mkdir -p src/security/access
mkdir -p src/security/privacy
mkdir -p src/security/consent
mkdir -p src/security/events


# =====================================
# ACCESS CONTROL
# =====================================

cat > src/security/access/permission.entity.ts <<'TS'
export interface PermissionEntity {
  id: string;
  subjectId: string;
  resource: string;
  action: string;
  granted: boolean;
  createdAt: Date;
}
TS


cat > src/security/access/access.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { PermissionEntity } from './permission.entity';


@Injectable()
export class AccessService {

  private permissions:
    PermissionEntity[] = [];


  grant(
    permission: PermissionEntity,
  ): PermissionEntity {

    this.permissions.push(permission);

    return permission;
  }


  canAccess(
    subjectId: string,
    resource: string,
    action: string,
  ): boolean {

    return this.permissions.some(
      (permission) =>
        permission.subjectId === subjectId &&
        permission.resource === resource &&
        permission.action === action &&
        permission.granted,
    );

  }

}
TS


# =====================================
# PRIVACY
# =====================================

cat > src/security/privacy/privacy.entity.ts <<'TS'
export interface PrivacyEntity {
  id: string;
  userId: string;
  profileVisible: boolean;
  locationVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}
TS


cat > src/security/privacy/privacy.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { PrivacyEntity } from './privacy.entity';


@Injectable()
export class PrivacyService {

  private settings:
    PrivacyEntity[] = [];


  save(
    privacy: PrivacyEntity,
  ): PrivacyEntity {

    this.settings.push(privacy);

    return privacy;
  }


  findByUser(
    userId: string,
  ): PrivacyEntity | undefined {

    return this.settings.find(
      (item) =>
        item.userId === userId,
    );
  }

}
TS


# =====================================
# CONSENT
# =====================================

cat > src/security/consent/consent.entity.ts <<'TS'
export interface ConsentEntity {
  id: string;
  userId: string;
  type:
    | 'terms'
    | 'privacy'
    | 'marketing';
  accepted: boolean;
  createdAt: Date;
}
TS


cat > src/security/consent/consent.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { ConsentEntity } from './consent.entity';


@Injectable()
export class ConsentService {

  private consents:
    ConsentEntity[] = [];


  record(
    consent: ConsentEntity,
  ): ConsentEntity {

    this.consents.push(consent);

    return consent;
  }


  hasConsent(
    userId: string,
    type: ConsentEntity['type'],
  ): boolean {

    return this.consents.some(
      (item) =>
        item.userId === userId &&
        item.type === type &&
        item.accepted,
    );

  }

}
TS


# =====================================
# SECURITY EVENTS
# =====================================

cat > src/security/events/security-event-bus.service.ts <<'TS'
import { Injectable } from '@nestjs/common';


export type SecurityEvent =
  | {
      type: 'permission.changed';
      subjectId: string;
    }
  | {
      type: 'consent.updated';
      userId: string;
    }
  | {
      type: 'privacy.changed';
      userId: string;
    };


@Injectable()
export class SecurityEventBusService {

  private listeners:
    ((event: SecurityEvent) => void)[] = [];


  subscribe(
    listener: (event: SecurityEvent) => void,
  ) {

    this.listeners.push(listener);

  }


  publish(
    event: SecurityEvent,
  ) {

    for (const listener of this.listeners) {
      listener(event);
    }

  }

}
TS


# =====================================
# TEST
# =====================================

mkdir -p test/security

cat > test/security/access.service.test.ts <<'TS'
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { AccessService } from '../../src/security/access/access.service';


describe('AccessService', () => {

  it('grants resource access', () => {

    const service =
      new AccessService();


    service.grant({
      id: 'permission-1',
      subjectId: 'user-1',
      resource: 'profile',
      action: 'view',
      granted: true,
      createdAt: new Date(),
    });


    assert.equal(
      service.canAccess(
        'user-1',
        'profile',
        'view',
      ),
      true,
    );

  });

});
TS


cd ../..

pnpm exec prettier --write .
pnpm --filter @neighbour/api run lint
pnpm --filter @neighbour/api run test
pnpm --filter @neighbour/api run build

echo "🎉 BUILD 0038 COMPLETE"

