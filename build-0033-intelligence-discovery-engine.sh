#!/bin/bash

set -e

echo "🚀 BUILD 0033 — Intelligence Discovery Engine"

cd services/api

mkdir -p src/intelligence/recommendation
mkdir -p src/intelligence/discovery
mkdir -p src/intelligence/personalisation
mkdir -p src/intelligence/events


# =====================================
# RECOMMENDATION ENGINE
# =====================================

cat > src/intelligence/recommendation/recommendation.entity.ts <<'TS'
export interface RecommendationEntity {
  id: string;
  userId: string;
  targetId: string;
  targetType:
    | 'community'
    | 'business'
    | 'event'
    | 'post';
  score: number;
  createdAt: Date;
}
TS


cat > src/intelligence/recommendation/recommendation.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { RecommendationEntity } from './recommendation.entity';


@Injectable()
export class RecommendationService {

  private recommendations:
    RecommendationEntity[] = [];


  create(
    recommendation: RecommendationEntity,
  ): RecommendationEntity {

    this.recommendations.push(
      recommendation,
    );

    return recommendation;
  }


  findForUser(
    userId: string,
  ): RecommendationEntity[] {

    return this.recommendations.filter(
      (item) =>
        item.userId === userId,
    );
  }


  rank(
    items: RecommendationEntity[],
  ): RecommendationEntity[] {

    return [...items].sort(
      (a, b) =>
        b.score - a.score,
    );
  }

}
TS


# =====================================
# DISCOVERY ENGINE
# =====================================

cat > src/intelligence/discovery/discovery.entity.ts <<'TS'
export interface DiscoveryEntity {
  id: string;
  userId: string;
  category: string;
  targetId: string;
  relevanceScore: number;
  createdAt: Date;
}
TS


cat > src/intelligence/discovery/discovery.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { DiscoveryEntity } from './discovery.entity';


@Injectable()
export class DiscoveryService {

  private discoveries:
    DiscoveryEntity[] = [];


  record(
    discovery: DiscoveryEntity,
  ): DiscoveryEntity {

    this.discoveries.push(
      discovery,
    );

    return discovery;
  }


  findForUser(
    userId: string,
  ): DiscoveryEntity[] {

    return this.discoveries.filter(
      (item) =>
        item.userId === userId,
    );
  }

}
TS


# =====================================
# PERSONALISATION
# =====================================

cat > src/intelligence/personalisation/preference.entity.ts <<'TS'
export interface PreferenceEntity {
  id: string;
  userId: string;
  category: string;
  value: string;
  createdAt: Date;
}
TS


cat > src/intelligence/personalisation/preference.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { PreferenceEntity } from './preference.entity';


@Injectable()
export class PreferenceService {

  private preferences:
    PreferenceEntity[] = [];


  save(
    preference: PreferenceEntity,
  ): PreferenceEntity {

    this.preferences.push(
      preference,
    );

    return preference;
  }


  findForUser(
    userId: string,
  ): PreferenceEntity[] {

    return this.preferences.filter(
      (item) =>
        item.userId === userId,
    );
  }

}
TS


# =====================================
# INTELLIGENCE EVENTS
# =====================================

cat > src/intelligence/events/intelligence-event-bus.service.ts <<'TS'
import { Injectable } from '@nestjs/common';


export type IntelligenceEvent =
  | {
      type: 'recommendation.generated';
      userId: string;
    }
  | {
      type: 'preference.changed';
      userId: string;
    };


@Injectable()
export class IntelligenceEventBusService {

  private listeners:
    ((event: IntelligenceEvent) => void)[] = [];


  subscribe(
    listener: (event: IntelligenceEvent) => void,
  ) {

    this.listeners.push(listener);

  }


  publish(
    event: IntelligenceEvent,
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

mkdir -p test/intelligence

cat > test/intelligence/recommendation.service.test.ts <<'TS'
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { RecommendationService } from '../../src/intelligence/recommendation/recommendation.service';


describe('RecommendationService', () => {

  it('ranks recommendations by score', () => {

    const service =
      new RecommendationService();


    const result =
      service.rank([
        {
          id: '1',
          userId: 'user',
          targetId: 'a',
          targetType: 'community',
          score: 10,
          createdAt: new Date(),
        },
        {
          id: '2',
          userId: 'user',
          targetId: 'b',
          targetType: 'event',
          score: 50,
          createdAt: new Date(),
        },
      ]);


    assert.equal(
      result[0].score,
      50,
    );

  });

});
TS


cd ../..

pnpm exec prettier --write .
pnpm --filter @neighbour/api run lint
pnpm --filter @neighbour/api run test
pnpm --filter @neighbour/api run build

echo "🎉 BUILD 0033 COMPLETE"

