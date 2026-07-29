#!/bin/bash

set -e

echo "🚀 BUILD 0030 — Trust Verification Engine"

cd services/api

mkdir -p src/trust/reputation
mkdir -p src/trust/verification
mkdir -p src/trust/events


# =====================================
# REPUTATION ENTITY
# =====================================

cat > src/trust/reputation/reputation.entity.ts <<'TS'
export interface ReputationEntity {
  id: string;
  userId: string;
  score: number;
  contributions: number;
  recommendations: number;
  createdAt: Date;
  updatedAt: Date;
}
TS


# =====================================
# REPUTATION SERVICE
# =====================================

cat > src/trust/reputation/reputation.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { ReputationEntity } from './reputation.entity';


@Injectable()
export class ReputationService {

  private records:
    ReputationEntity[] = [];


  create(
    reputation: ReputationEntity,
  ): ReputationEntity {

    this.records.push(reputation);

    return reputation;
  }


  findByUser(
    userId: string,
  ): ReputationEntity | undefined {

    return this.records.find(
      (item) =>
        item.userId === userId,
    );
  }


  updateScore(
    userId: string,
    amount: number,
  ): ReputationEntity | undefined {

    const record =
      this.findByUser(userId);

    if (!record) {
      return undefined;
    }

    record.score += amount;
    record.updatedAt = new Date();

    return record;
  }

}
TS


# =====================================
# VERIFICATION ENTITY
# =====================================

cat > src/trust/verification/verification.entity.ts <<'TS'
export interface VerificationEntity {
  id: string;
  subjectId: string;
  subjectType: 'user' | 'business';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}
TS


# =====================================
# VERIFICATION SERVICE
# =====================================

cat > src/trust/verification/verification.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { VerificationEntity } from './verification.entity';


@Injectable()
export class VerificationService {

  private requests:
    VerificationEntity[] = [];


  create(
    request: VerificationEntity,
  ): VerificationEntity {

    this.requests.push(request);

    return request;
  }


  approve(
    id: string,
  ): VerificationEntity | undefined {

    const request =
      this.requests.find(
        (item) => item.id === id,
      );

    if (!request) {
      return undefined;
    }

    request.status = 'approved';
    request.updatedAt = new Date();

    return request;
  }


  findBySubject(
    subjectId: string,
  ) {

    return this.requests.filter(
      (item) =>
        item.subjectId === subjectId,
    );
  }

}
TS


# =====================================
# TRUST EVENTS
# =====================================

cat > src/trust/events/trust-event-bus.service.ts <<'TS'
import { Injectable } from '@nestjs/common';


export type TrustEvent =
  | {
      type: 'verification.completed';
      subjectId: string;
    }
  | {
      type: 'reputation.updated';
      userId: string;
    };


@Injectable()
export class TrustEventBusService {

  private listeners:
    ((event: TrustEvent) => void)[] = [];


  subscribe(
    listener: (event: TrustEvent) => void,
  ) {

    this.listeners.push(listener);

  }


  publish(
    event: TrustEvent,
  ) {

    for (const listener of this.listeners) {
      listener(event);
    }

  }

}
TS


# =====================================
# TRUST PROFILE
# =====================================

cat > src/trust/trust-profile.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import { ReputationService } from './reputation/reputation.service';
import { VerificationService } from './verification/verification.service';


@Injectable()
export class TrustProfileService {

  constructor(
    private readonly reputation: ReputationService,
    private readonly verification: VerificationService,
  ) {}


  getUserTrust(
    userId: string,
  ) {

    return {
      reputation:
        this.reputation.findByUser(userId),

      verification:
        this.verification.findBySubject(userId),
    };

  }

}
TS


# =====================================
# TEST
# =====================================

mkdir -p test/trust

cat > test/trust/reputation.service.test.ts <<'TS'
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ReputationService } from '../../src/trust/reputation/reputation.service';


describe('ReputationService', () => {

  it('stores reputation records', () => {

    const service =
      new ReputationService();


    const result =
      service.create({
        id: 'rep-1',
        userId: 'user-1',
        score: 10,
        contributions: 2,
        recommendations: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });


    assert.equal(
      result.score,
      10,
    );

  });

});
TS


cd ../..

pnpm exec prettier --write .
pnpm --filter @neighbour/api run lint
pnpm --filter @neighbour/api run test
pnpm --filter @neighbour/api run build

echo "🎉 BUILD 0030 COMPLETE"

