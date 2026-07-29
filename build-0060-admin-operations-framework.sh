#!/bin/bash

set -e

echo "🚀 BUILD 0060 — Admin Operations Framework"


mkdir -p services/api/src/platform/admin/readiness
mkdir -p services/api/test/platform/admin/readiness


echo "📋 Creating admin status entity"


cat > services/api/src/platform/admin/readiness/admin-status.entity.ts <<'TS'
export interface AdminStatusEntity {

  domain: string;

  users: string;

  moderation: string;

  control: string;

  status: string;

}
TS
echo "📋 Creating user management readiness service"


cat > services/api/src/platform/admin/readiness/user-management-readiness.service.ts <<'TS'
import { Injectable } from '@nestjs/common';


@Injectable()
export class UserManagementReadinessService {


  check(
    users: string,
  ) {

    return {

      users,

      ready:
        users === 'READY',

      checkedAt: new Date(),

    };

  }


}
TS


echo "📋 Creating moderation readiness service"


cat > services/api/src/platform/admin/readiness/moderation-readiness.service.ts <<'TS'
import { Injectable } from '@nestjs/common';


@Injectable()
export class ModerationReadinessService {


  check(
    moderation: string,
  ) {

    return {

      moderation,

      ready:
        moderation === 'READY',

      checkedAt: new Date(),

    };

  }


}
TS


echo "📋 Creating platform control readiness service"


cat > services/api/src/platform/admin/readiness/platform-control-readiness.service.ts <<'TS'
import { Injectable } from '@nestjs/common';


@Injectable()
export class PlatformControlReadinessService {


  check(
    control: string,
  ) {

    return {

      control,

      ready:
        control === 'READY',

      checkedAt: new Date(),

    };

  }


}
TS
echo "🧪 Creating admin operations tests"


cat > services/api/test/platform/admin/readiness/user-management-readiness.service.test.ts <<'TS'
import assert from 'node:assert/strict';

import { describe, it } from 'node:test';

import { UserManagementReadinessService } from '../../../../src/platform/admin/readiness/user-management-readiness.service';


describe('UserManagementReadinessService', () => {


  it('marks user management as ready', () => {


    const service =
      new UserManagementReadinessService();


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


echo "🎉 BUILD 0060 COMPLETE"
