#!/bin/bash

set -e

echo "🚀 BUILD 0026 — Neighbourhood Engine v1"

mkdir -p src/neighbourhood/membership
mkdir -p test/neighbourhood


# ==============================
# Neighbourhood Entity
# ==============================

cat > src/neighbourhood/neighbourhood.entity.ts <<'TS'
export interface NeighbourhoodEntity {
  id: string;
  name: string;
  description: string;
  localArea: string | null;
  createdAt: Date;
  updatedAt: Date;
}
TS


# ==============================
# Neighbourhood Repository
# ==============================

cat > src/neighbourhood/neighbourhood.repository.ts <<'TS'
import type { NeighbourhoodEntity } from './neighbourhood.entity';

export abstract class NeighbourhoodRepository {

  abstract save(
    neighbourhood: NeighbourhoodEntity,
  ): Promise<NeighbourhoodEntity>;

  abstract findById(
    id: string,
  ): Promise<NeighbourhoodEntity | undefined>;

  abstract findAll(): Promise<NeighbourhoodEntity[]>;

  abstract update(
    neighbourhood: NeighbourhoodEntity,
  ): Promise<NeighbourhoodEntity>;

}
TS


# ==============================
# Membership Entity
# ==============================

cat > src/neighbourhood/membership/membership.entity.ts <<'TS'
export interface MembershipEntity {
  id: string;
  userId: string;
  neighbourhoodId: string;
  createdAt: Date;
}
TS


# ==============================
# Membership Repository
# ==============================

cat > src/neighbourhood/membership/membership.repository.ts <<'TS'
import type { MembershipEntity } from './membership.entity';

export abstract class MembershipRepository {

  abstract save(
    membership: MembershipEntity,
  ): Promise<MembershipEntity>;

  abstract remove(
    userId: string,
    neighbourhoodId: string,
  ): Promise<void>;

  abstract findByUser(
    userId: string,
  ): Promise<MembershipEntity[]>;

  abstract findMembers(
    neighbourhoodId: string,
  ): Promise<MembershipEntity[]>;

}
TS


# ==============================
# Neighbourhood Service
# ==============================

cat > src/neighbourhood/neighbourhood.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { NeighbourhoodEntity } from './neighbourhood.entity';

import { NeighbourhoodRepository } from './neighbourhood.repository';

@Injectable()
export class NeighbourhoodService {

  constructor(
    private readonly repository: NeighbourhoodRepository,
  ) {}

  create(
    neighbourhood: NeighbourhoodEntity,
  ): Promise<NeighbourhoodEntity> {
    return this.repository.save(neighbourhood);
  }

  findById(
    id: string,
  ): Promise<NeighbourhoodEntity | undefined> {
    return this.repository.findById(id);
  }

  findAll(): Promise<NeighbourhoodEntity[]> {
    return this.repository.findAll();
  }

  update(
    neighbourhood: NeighbourhoodEntity,
  ): Promise<NeighbourhoodEntity> {
    return this.repository.update(neighbourhood);
  }

}
TS


# ==============================
# Membership Service
# ==============================

cat > src/neighbourhood/membership/membership.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { MembershipEntity } from './membership.entity';

import { MembershipRepository } from './membership.repository';

@Injectable()
export class MembershipService {

  constructor(
    private readonly repository: MembershipRepository,
  ) {}

  join(
    membership: MembershipEntity,
  ): Promise<MembershipEntity> {
    return this.repository.save(membership);
  }


  leave(
    userId: string,
    neighbourhoodId: string,
  ): Promise<void> {
    return this.repository.remove(
      userId,
      neighbourhoodId,
    );
  }


  findUserMemberships(
    userId: string,
  ): Promise<MembershipEntity[]> {
    return this.repository.findByUser(userId);
  }


  findMembers(
    neighbourhoodId: string,
  ): Promise<MembershipEntity[]> {
    return this.repository.findMembers(
      neighbourhoodId,
    );
  }

}
TS


# ==============================
# Responses
# ==============================

cat > src/neighbourhood/neighbourhood.response.ts <<'TS'
export interface NeighbourhoodResponse {
  id: string;
  name: string;
  description: string;
  localArea: string | null;
}

export interface MembershipResponse {
  id: string;
  userId: string;
  neighbourhoodId: string;
}
TS


# ==============================
# Tests
# ==============================

cat > test/neighbourhood/neighbourhood.service.test.ts <<'TS'
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { NeighbourhoodService } from '../../src/neighbourhood/neighbourhood.service';


describe('NeighbourhoodService', () => {

  it('creates neighbourhoods', async () => {

    const service =
      new NeighbourhoodService({
        save(item: unknown) {
          return Promise.resolve(item);
        },
      } as never);


    const result =
      await service.create({
        id: 'n1',
        name: 'Blackley',
        description: 'Local area',
        localArea: 'Manchester',
        createdAt: new Date(),
        updatedAt: new Date(),
      });


    assert.equal(
      result.name,
      'Blackley',
    );

  });

});
TS


pnpm format
pnpm --filter @neighbour/api run lint
pnpm --filter @neighbour/api run test
pnpm --filter @neighbour/api run build

echo "✅ BUILD 0026 COMPLETE"
