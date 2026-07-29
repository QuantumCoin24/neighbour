#!/bin/bash

set -e

echo "🚀 BUILD 0035 — Search Maps Discovery Engine"

cd services/api

mkdir -p src/search
mkdir -p src/location
mkdir -p src/discovery


# =====================================
# SEARCH ENGINE
# =====================================

cat > src/search/search.entity.ts <<'TS'
export interface SearchEntity {
  id: string;
  query: string;
  category:
    | 'user'
    | 'community'
    | 'business'
    | 'event'
    | 'service';
  targetId: string;
  createdAt: Date;
}
TS


cat > src/search/search.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { SearchEntity } from './search.entity';


@Injectable()
export class SearchService {

  private results:
    SearchEntity[] = [];


  index(
    item: SearchEntity,
  ): SearchEntity {

    this.results.push(item);

    return item;
  }


  search(
    query: string,
  ): SearchEntity[] {

    return this.results.filter(
      (item) =>
        item.query
          .toLowerCase()
          .includes(
            query.toLowerCase(),
          ),
    );
  }

}
TS


# =====================================
# LOCATION FOUNDATION
# =====================================

cat > src/location/location.entity.ts <<'TS'
export interface LocationEntity {
  id: string;
  subjectId: string;
  latitude: number;
  longitude: number;
  area: string;
  createdAt: Date;
}
TS


cat > src/location/location.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { LocationEntity } from './location.entity';


@Injectable()
export class LocationService {

  private locations:
    LocationEntity[] = [];


  save(
    location: LocationEntity,
  ): LocationEntity {

    this.locations.push(location);

    return location;
  }


  findByArea(
    area: string,
  ): LocationEntity[] {

    return this.locations.filter(
      (item) =>
        item.area === area,
    );
  }

}
TS


# =====================================
# DISCOVERY RANKING
# =====================================

cat > src/discovery/ranking.entity.ts <<'TS'
export interface RankingEntity {
  id: string;
  targetId: string;
  category: string;
  relevanceScore: number;
  trustScore: number;
  createdAt: Date;
}
TS


cat > src/discovery/ranking.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { RankingEntity } from './ranking.entity';


@Injectable()
export class RankingService {

  rank(
    items: RankingEntity[],
  ): RankingEntity[] {

    return [...items].sort(
      (a, b) =>
        (
          b.relevanceScore +
          b.trustScore
        )
        -
        (
          a.relevanceScore +
          a.trustScore
        ),
    );
  }

}
TS


# =====================================
# TEST
# =====================================

mkdir -p test/search

cat > test/search/search.service.test.ts <<'TS'
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { SearchService } from '../../src/search/search.service';


describe('SearchService', () => {

  it('finds indexed results', () => {

    const service =
      new SearchService();


    service.index({
      id: '1',
      query: 'Blackley Community',
      category: 'community',
      targetId: 'community-1',
      createdAt: new Date(),
    });


    const result =
      service.search('Blackley');


    assert.ok(result[0]);

    assert.equal(
      result[0].targetId,
      'community-1',
    );

  });

});
TS


cd ../..

pnpm exec prettier --write .
pnpm --filter @neighbour/api run lint
pnpm --filter @neighbour/api run test
pnpm --filter @neighbour/api run build

echo "🎉 BUILD 0035 COMPLETE"

