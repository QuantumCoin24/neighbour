#!/bin/bash

set -e

echo "🚀 BUILD 0053 — Core Activation Framework"

mkdir -p services/api/src/platform/activation
mkdir -p services/api/test/platform/activation

cat > services/api/src/platform/activation/activation-plan.entity.ts <<'TS'
export interface ActivationPlanEntity {


  domain: string;

  currentState: string;

  requiredAction: string;

  priority: string;

  launchImpact: string;

}
TS

echo "📋 Creating activation plan service"

cat > services/api/src/platform/activation/activation-plan.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { ActivationPlanEntity } from './activation-plan.entity';


@Injectable()
export class ActivationPlanService {

  create(
    plan: ActivationPlanEntity,
  ) {

    return {

      ...plan,

      createdAt: new Date(),

    };

  }

}
TS


echo "📋 Creating activation priority service"

cat > services/api/src/platform/activation/activation-priority.service.ts <<'TS'
import { Injectable } from '@nestjs/common';


@Injectable()
export class ActivationPriorityService {

  evaluate(
    priority: string,
  ) {

    return {

      priority,

      requiresAttention:
        priority === 'HIGH',

      evaluatedAt: new Date(),

    };

  }

}
TS


echo "📋 Creating activation status service"

cat > services/api/src/platform/activation/activation-status.service.ts <<'TS'
import { Injectable } from '@nestjs/common';


@Injectable()
export class ActivationStatusService {

  status(
    domain: string,
    state: string,
  ) {

    return {

      domain,

      state,

      checkedAt: new Date(),

    };

  }

}
TS

echo "🧪 Creating activation framework tests"

cat > services/api/test/platform/activation/activation-plan.service.test.ts <<'TS'
import assert from 'node:assert/strict';

import { describe, it } from 'node:test';

import { ActivationPlanService } from '../../../src/platform/activation/activation-plan.service';


describe('ActivationPlanService', () => {

  it('creates activation plans', () => {

    const service =
      new ActivationPlanService();


    const result =
      service.create({

        domain: 'trust',

        currentState: 'FOUNDATION',

        requiredAction: 'MODULE_ACTIVATION',

        priority: 'HIGH',

        launchImpact: 'SAFETY',

      });


    assert.equal(
      result.domain,
      'trust',
    );


  });

});
TS


cd services/api

rm -rf dist

pnpm run lint

pnpm run test

pnpm run build


echo "🎉 BUILD 0053 COMPLETE"
