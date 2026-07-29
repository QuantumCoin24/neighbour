#!/bin/bash

set -e

echo "🚀 BUILD 0051 — Command & Control Engine"

cd services/api

mkdir -p src/platform/command


cat > src/platform/command/command.entity.ts <<'TS'
export interface CommandEntity {

  id: string;

  type: string;

  payload: unknown;

  status: 'created' | 'executed' | 'failed';

  createdAt: Date;

}
TS


cat > src/platform/command/command.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { CommandEntity } from './command.entity';


@Injectable()
export class CommandService {

  create(
    command: CommandEntity,
  ): CommandEntity {

    return command;

  }

}
TS


cat > src/platform/command/command-router.service.ts <<'TS'
import { Injectable } from '@nestjs/common';


@Injectable()
export class CommandRouterService {

  route(
    type: string,
  ) {

    return {

      commandType: type,

      routed: true,

    };

  }

}
TS


cat > src/platform/command/command-history.service.ts <<'TS'
import { Injectable } from '@nestjs/common';


@Injectable()
export class CommandHistoryService {

  record(
    commandId: string,
    result: string,
  ) {

    return {

      commandId,

      result,

      createdAt: new Date(),

    };

  }

}
TS


mkdir -p test/platform/command


cat > test/platform/command/command.service.test.ts <<'TS'
import assert from 'node:assert/strict';

import { describe, it } from 'node:test';

import { CommandService } from '../../../src/platform/command/command.service';


describe('CommandService', () => {

  it('creates platform commands', () => {

    const service =
      new CommandService();


    const result =
      service.create({

        id: 'command-1',

        type: 'health.check',

        payload: {},

        status: 'created',

        createdAt: new Date(),

      });


    assert.equal(

      result.type,

      'health.check'

    );

  });

});
TS


cd ../..

rm -rf services/api/dist

pnpm --filter @neighbour/api run lint
pnpm --filter @neighbour/api run test
pnpm --filter @neighbour/api run build

echo "🎉 BUILD 0051 COMPLETE"
