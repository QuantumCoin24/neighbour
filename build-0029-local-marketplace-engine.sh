#!/bin/bash

set -e

echo "🚀 BUILD 0029 — Local Marketplace Engine"

cd services/api

mkdir -p src/marketplace/business
mkdir -p src/marketplace/services
mkdir -p src/marketplace/recommendation
mkdir -p src/marketplace/events


# =====================================
# BUSINESS ENTITY
# =====================================

cat > src/marketplace/business/business.entity.ts <<'TS'
export interface BusinessEntity {
  id: string;
  communityId: string;
  ownerId: string;
  name: string;
  description: string;
  category: string;
  createdAt: Date;
}
TS


# =====================================
# BUSINESS REPOSITORY
# =====================================

cat > src/marketplace/business/business.repository.ts <<'TS'
import type { BusinessEntity } from './business.entity';

export abstract class BusinessRepository {

  abstract save(
    business: BusinessEntity,
  ): Promise<BusinessEntity>;

  abstract findById(
    id: string,
  ): Promise<BusinessEntity | undefined>;

  abstract findByCommunity(
    communityId: string,
  ): Promise<BusinessEntity[]>;

  abstract search(
    query: string,
  ): Promise<BusinessEntity[]>;

}
TS


# =====================================
# BUSINESS SERVICE
# =====================================

cat > src/marketplace/business/business.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { BusinessEntity } from './business.entity';

import { BusinessRepository } from './business.repository';


@Injectable()
export class BusinessService {

  constructor(
    private readonly repository: BusinessRepository,
  ) {}


  create(
    business: BusinessEntity,
  ): Promise<BusinessEntity> {
    return this.repository.save(business);
  }


  findCommunityBusinesses(
    communityId: string,
  ): Promise<BusinessEntity[]> {
    return this.repository.findByCommunity(
      communityId,
    );
  }


  search(
    query: string,
  ): Promise<BusinessEntity[]> {
    return this.repository.search(query);
  }

}
TS


# =====================================
# SERVICE CATALOGUE
# =====================================

cat > src/marketplace/services/service.entity.ts <<'TS'
export interface MarketplaceServiceEntity {
  id: string;
  businessId: string;
  name: string;
  description: string;
  category: string;
  createdAt: Date;
}
TS


cat > src/marketplace/services/service.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { MarketplaceServiceEntity } from './service.entity';


@Injectable()
export class MarketplaceServiceService {

  private services:
    MarketplaceServiceEntity[] = [];


  create(
    service: MarketplaceServiceEntity,
  ): MarketplaceServiceEntity {

    this.services.push(service);

    return service;
  }


  findByBusiness(
    businessId: string,
  ): MarketplaceServiceEntity[] {

    return this.services.filter(
      (service) =>
        service.businessId === businessId,
    );
  }

}
TS


# =====================================
# RECOMMENDATIONS
# =====================================

cat > src/marketplace/recommendation/recommendation.entity.ts <<'TS'
export interface RecommendationEntity {
  id: string;
  businessId: string;
  userId: string;
  message: string;
  createdAt: Date;
}
TS


cat > src/marketplace/recommendation/recommendation.service.ts <<'TS'
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


  listForBusiness(
    businessId: string,
  ): RecommendationEntity[] {

    return this.recommendations.filter(
      (item) =>
        item.businessId === businessId,
    );
  }

}
TS


# =====================================
# MARKETPLACE EVENTS
# =====================================

cat > src/marketplace/events/marketplace-event-bus.service.ts <<'TS'
import { Injectable } from '@nestjs/common';


export type MarketplaceEvent =
  | {
      type: 'business.created';
      businessId: string;
    }
  | {
      type: 'recommendation.created';
      recommendationId: string;
    };


@Injectable()
export class MarketplaceEventBusService {

  private listeners:
    ((event: MarketplaceEvent) => void)[] = [];


  subscribe(
    listener: (event: MarketplaceEvent) => void,
  ) {

    this.listeners.push(listener);

  }


  publish(
    event: MarketplaceEvent,
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

mkdir -p test/marketplace

cat > test/marketplace/business.service.test.ts <<'TS'
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { BusinessService } from '../../src/marketplace/business/business.service';


describe('BusinessService', () => {

  it('creates businesses', async () => {

    const service =
      new BusinessService({
        save(item: unknown) {
          return Promise.resolve(item);
        },
      } as never);


    const result =
      await service.create({
        id: 'business-1',
        communityId: 'community-1',
        ownerId: 'user-1',
        name: 'Local Cafe',
        description: 'Community cafe',
        category: 'Food',
        createdAt: new Date(),
      });


    assert.equal(
      result.name,
      'Local Cafe',
    );

  });

});
TS


cd ../..

pnpm exec prettier --write .
pnpm --filter @neighbour/api run lint
pnpm --filter @neighbour/api run test
pnpm --filter @neighbour/api run build

echo "🎉 BUILD 0029 COMPLETE"

