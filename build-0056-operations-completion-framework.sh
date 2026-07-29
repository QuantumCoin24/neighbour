#!/bin/bash

set -e

echo "🚀 BUILD 0056 — Operations Completion Framework"


mkdir -p services/api/src/platform/operations/readiness
mkdir -p services/api/test/platform/operations/readiness


echo "📋 Creating operational status entity"


cat > services/api/src/platform/operations/readiness/operational-status.entity.ts <<'TS'
export interface OperationalStatusEntity {

  domain: string;

  health: string;

  metrics: string;

  alerts: string;

  status: string;

}
TS
echo "📋 Creating operational readiness service"


cat > services/api/src/platform/operations/readiness/operational-readiness.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { OperationalStatusEntity } from './operational-status.entity';


@Injectable()
export class OperationalReadinessService {


  evaluate(
    status: OperationalStatusEntity,
  ) {

    return {

      ...status,

      ready:
        status.status === 'READY',

      checkedAt: new Date(),

    };

  }


}
TS


echo "📋 Creating health readiness service"


cat > services/api/src/platform/operations/readiness/health-readiness.service.ts <<'TS'
import { Injectable } from '@nestjs/common';


@Injectable()
export class HealthReadinessService {


  check(
    health: string,
  ) {

    return {

      health,

      available:
        health === 'READY',

      checkedAt: new Date(),

    };

  }


}
TS


echo "📋 Creating metrics readiness service"


cat > services/api/src/platform/operations/readiness/metrics-readiness.service.ts <<'TS'
import { Injectable } from '@nestjs/common';


@Injectable()
export class MetricsReadinessService {


  check(
    metrics: string,
  ) {

    return {

      metrics,

      available:
        metrics === 'READY',

      checkedAt: new Date(),

    };

  }


}
TS
echo "🧪 Creating operations readiness tests"


cat > services/api/test/platform/operations/readiness/operational-readiness.service.test.ts <<'TS'
import assert from 'node:assert/strict';

import { describe, it } from 'node:test';

import { OperationalReadinessService } from '../../../../src/platform/operations/readiness/operational-readiness.service';


describe('OperationalReadinessService', () => {


  it('marks ready operations as available', () => {


    const service =
      new OperationalReadinessService();


    const result =
      service.evaluate({

        domain: 'platform',

        health: 'READY',

        metrics: 'READY',

        alerts: 'READY',

        status: 'READY',

      });


    assert.equal(
      result.ready,
      true,
    );


  });


});
TS


cd services/api

rm -rf dist

pnpm run lint

pnpm run test

pnpm run build


echo "🎉 BUILD 0056 COMPLETE"
