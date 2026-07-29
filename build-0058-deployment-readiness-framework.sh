#!/bin/bash

set -e

echo "🚀 BUILD 0058 — Deployment Readiness Framework"


mkdir -p services/api/src/platform/deployment/readiness
mkdir -p services/api/test/platform/deployment/readiness


echo "📋 Creating deployment status entity"


cat > services/api/src/platform/deployment/readiness/deployment-status.entity.ts <<'TS'
export interface DeploymentStatusEntity {

  environment: string;

  configuration: string;

  release: string;

  deployment: string;

  status: string;

}
TS
echo "📋 Creating environment readiness service"


cat > services/api/src/platform/deployment/readiness/environment-readiness.service.ts <<'TS'
import { Injectable } from '@nestjs/common';


@Injectable()
export class EnvironmentReadinessService {


  check(
    environment: string,
  ) {

    return {

      environment,

      ready:
        environment === 'READY',

      checkedAt: new Date(),

    };

  }


}
TS


echo "📋 Creating configuration readiness service"


cat > services/api/src/platform/deployment/readiness/configuration-readiness.service.ts <<'TS'
import { Injectable } from '@nestjs/common';


@Injectable()
export class ConfigurationReadinessService {


  check(
    configuration: string,
  ) {

    return {

      configuration,

      ready:
        configuration === 'READY',

      checkedAt: new Date(),

    };

  }


}
TS


echo "📋 Creating release readiness service"


cat > services/api/src/platform/deployment/readiness/release-readiness.service.ts <<'TS'
import { Injectable } from '@nestjs/common';


@Injectable()
export class ReleaseReadinessService {


  check(
    release: string,
  ) {

    return {

      release,

      ready:
        release === 'READY',

      checkedAt: new Date(),

    };

  }


}
TS
echo "🧪 Creating deployment readiness tests"


cat > services/api/test/platform/deployment/readiness/deployment-readiness.service.test.ts <<'TS'
import assert from 'node:assert/strict';

import { describe, it } from 'node:test';

import { EnvironmentReadinessService } from '../../../../src/platform/deployment/readiness/environment-readiness.service';


describe('EnvironmentReadinessService', () => {


  it('marks ready environments as available', () => {


    const service =
      new EnvironmentReadinessService();


    const result =
      service.check(
        'READY',
      );


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


echo "🎉 BUILD 0058 COMPLETE"
