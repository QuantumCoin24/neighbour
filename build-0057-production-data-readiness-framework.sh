#!/bin/bash

set -e

echo "🚀 BUILD 0057 — Production Data Readiness Framework"


mkdir -p services/api/src/platform/data/readiness
mkdir -p services/api/test/platform/data/readiness


echo "📋 Creating production data status entity"


cat > services/api/src/platform/data/readiness/production-data-status.entity.ts <<'TS'
export interface ProductionDataStatusEntity {

  domain: string;

  schema: string;

  migrations: string;

  backups: string;

  status: string;

}
TS
echo "📋 Creating database readiness service"


cat > services/api/src/platform/data/readiness/database-readiness.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { ProductionDataStatusEntity } from './production-data-status.entity';


@Injectable()
export class DatabaseReadinessService {


  evaluate(
    status: ProductionDataStatusEntity,
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


echo "📋 Creating migration readiness service"


cat > services/api/src/platform/data/readiness/migration-readiness.service.ts <<'TS'
import { Injectable } from '@nestjs/common';


@Injectable()
export class MigrationReadinessService {


  check(
    migrations: string,
  ) {

    return {

      migrations,

      available:
        migrations === 'READY',

      checkedAt: new Date(),

    };

  }


}
TS


echo "📋 Creating backup readiness service"


cat > services/api/src/platform/data/readiness/backup-readiness.service.ts <<'TS'
import { Injectable } from '@nestjs/common';


@Injectable()
export class BackupReadinessService {


  check(
    backups: string,
  ) {

    return {

      backups,

      available:
        backups === 'READY',

      checkedAt: new Date(),

    };

  }


}
TS
echo "🧪 Creating production data readiness tests"


cat > services/api/test/platform/data/readiness/database-readiness.service.test.ts <<'TS'
import assert from 'node:assert/strict';

import { describe, it } from 'node:test';

import { DatabaseReadinessService } from '../../../../src/platform/data/readiness/database-readiness.service';


describe('DatabaseReadinessService', () => {


  it('marks production data as ready', () => {


    const service =
      new DatabaseReadinessService();


    const result =
      service.evaluate({

        domain: 'database',

        schema: 'READY',

        migrations: 'READY',

        backups: 'READY',

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


echo "🎉 BUILD 0057 COMPLETE"
