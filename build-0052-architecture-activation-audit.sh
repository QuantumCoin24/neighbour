#!/bin/bash

set -e

echo "🚀 BUILD 0052 — Architecture Activation Audit"

ROOT_DIR=$(pwd)

mkdir -p services/api/src/platform/audit/activation
mkdir -p services/api/test/platform/audit/activation


echo "📋 Creating activation audit entity"


cat > services/api/src/platform/audit/activation/activation-record.entity.ts <<'TS'
export interface ActivationRecordEntity {

  domain: string;

  service: boolean;

  module: boolean;

  controller: boolean;

  database: boolean;

  status: string;

}
TS


echo "📋 Creating activation audit service"


cat > services/api/src/platform/audit/activation/activation-audit.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { ActivationRecordEntity } from './activation-record.entity';


@Injectable()
export class ActivationAuditService {

  analyse(
    record: ActivationRecordEntity,
  ) {

    let status = 'FOUNDATION';


    if (
      record.service &&
      record.module &&
      record.controller &&
      record.database
    ) {

      status = 'ACTIVE';

    }


    return {

      ...record,

      status,

      auditedAt: new Date(),

    };

  }


}
TS


echo "📋 Creating activation matrix service"


cat > services/api/src/platform/audit/activation/activation-matrix.service.ts <<'TS'
import { Injectable } from '@nestjs/common';


@Injectable()
export class ActivationMatrixService {


  generate() {

    return [

      {
        domain: 'auth',
        status: 'ACTIVE',
      },

      {
        domain: 'community',
        status: 'ACTIVE',
      },

      {
        domain: 'profile',
        status: 'ACTIVE',
      },

      {
        domain: 'marketplace',
        status: 'FOUNDATION',
      },

      {
        domain: 'payments',
        status: 'FOUNDATION',
      },

    ];

  }


}
TS


echo "🧪 Creating tests"


cat > services/api/test/platform/audit/activation/activation-audit.service.test.ts <<'TS'
import assert from 'node:assert/strict';

import { describe, it } from 'node:test';

import { ActivationAuditService } from '../../../../src/platform/audit/activation/activation-audit.service';


describe('ActivationAuditService', () => {


  it('identifies active domains', () => {


    const service =
      new ActivationAuditService();


    const result =
      service.analyse({

        domain: 'auth',

        service: true,

        module: true,

        controller: true,

        database: true,

        status: '',

      });


    assert.equal(
      result.status,
      'ACTIVE',
    );


  });


});
TS


cd services/api

rm -rf dist

pnpm run lint

pnpm run test

pnpm run build


echo "🎉 BUILD 0052 COMPLETE"
