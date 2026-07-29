#!/bin/bash

set -e

echo "🚀 BUILD 0042 — Developer API SDK Engine"

cd services/api

mkdir -p src/developer/apps
mkdir -p src/developer/keys
mkdir -p src/developer/scopes
mkdir -p src/developer/events


# =====================================
# DEVELOPER APPLICATIONS
# =====================================

cat > src/developer/apps/developer-app.entity.ts <<'TS'
export interface DeveloperAppEntity {
  id: string;
  ownerId: string;
  name: string;
  status:
    | 'active'
    | 'disabled';
  createdAt: Date;
}
TS


cat > src/developer/apps/developer-app.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { DeveloperAppEntity } from './developer-app.entity';


@Injectable()
export class DeveloperAppService {

  private apps:
    DeveloperAppEntity[] = [];


  create(
    app: DeveloperAppEntity,
  ): DeveloperAppEntity {

    this.apps.push(app);

    return app;
  }


  findByOwner(
    ownerId: string,
  ): DeveloperAppEntity[] {

    return this.apps.filter(
      (item) =>
        item.ownerId === ownerId,
    );
  }

}
TS


# =====================================
# API KEYS
# =====================================

cat > src/developer/keys/api-key.entity.ts <<'TS'
export interface ApiKeyEntity {
  id: string;
  appId: string;
  key: string;
  active: boolean;
  createdAt: Date;
}
TS


cat > src/developer/keys/api-key.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { ApiKeyEntity } from './api-key.entity';


@Injectable()
export class ApiKeyService {

  private keys:
    ApiKeyEntity[] = [];


  create(
    apiKey: ApiKeyEntity,
  ): ApiKeyEntity {

    this.keys.push(apiKey);

    return apiKey;
  }


  findByApp(
    appId: string,
  ): ApiKeyEntity[] {

    return this.keys.filter(
      (item) =>
        item.appId === appId,
    );
  }

}
TS


# =====================================
# API SCOPES
# =====================================

cat > src/developer/scopes/api-scope.entity.ts <<'TS'
export interface ApiScopeEntity {
  id: string;
  appId: string;
  scope:
    | 'profile.read'
    | 'community.read'
    | 'events.read'
    | 'events.write'
    | 'business.read';
  enabled: boolean;
  createdAt: Date;
}
TS


cat > src/developer/scopes/scope.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { ApiScopeEntity } from './api-scope.entity';


@Injectable()
export class ScopeService {

  private scopes:
    ApiScopeEntity[] = [];


  grant(
    scope: ApiScopeEntity,
  ): ApiScopeEntity {

    this.scopes.push(scope);

    return scope;
  }


  findByApp(
    appId: string,
  ): ApiScopeEntity[] {

    return this.scopes.filter(
      (item) =>
        item.appId === appId,
    );
  }

}
TS


# =====================================
# DEVELOPER EVENTS
# =====================================

cat > src/developer/events/developer-event-bus.service.ts <<'TS'
import { Injectable } from '@nestjs/common';


export type DeveloperEvent =
  | {
      type: 'developer.app.created';
      appId: string;
    }
  | {
      type: 'api.key.generated';
      keyId: string;
    }
  | {
      type: 'scope.updated';
      appId: string;
    };


@Injectable()
export class DeveloperEventBusService {

  private listeners:
    ((event: DeveloperEvent) => void)[] = [];


  subscribe(
    listener: (event: DeveloperEvent) => void,
  ) {

    this.listeners.push(listener);

  }


  publish(
    event: DeveloperEvent,
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

mkdir -p test/developer

cat > test/developer/developer-app.service.test.ts <<'TS'
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DeveloperAppService } from '../../src/developer/apps/developer-app.service';


describe('DeveloperAppService', () => {

  it('creates developer applications', () => {

    const service =
      new DeveloperAppService();


    const result =
      service.create({
        id: 'app-1',
        ownerId: 'developer-1',
        name: 'Neighbour Partner App',
        status: 'active',
        createdAt: new Date(),
      });


    assert.equal(
      result.status,
      'active',
    );

  });

});
TS


cd ../..

rm -rf services/api/dist

pnpm --filter @neighbour/api run lint
pnpm --filter @neighbour/api run test
pnpm --filter @neighbour/api run build

echo "🎉 BUILD 0042 COMPLETE"

