#!/bin/bash

set -e

echo "🚀 BUILD 0050 — Platform Event Orchestration Bus"

cd services/api

mkdir -p src/platform/events


cat > src/platform/events/event.entity.ts <<'TS'
export interface EventEntity {
  id: string;
  type: string;
  payload: unknown;
  createdAt: Date;
}
TS


cat > src/platform/events/event-bus.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { EventEntity } from './event.entity';


@Injectable()
export class EventBusService {

  private events: EventEntity[] = [];


  publish(
    event: EventEntity,
  ): EventEntity {

    this.events.push(event);

    return event;

  }


  list(): EventEntity[] {
    return this.events;
  }

}
TS


cat > src/platform/events/event-router.service.ts <<'TS'
import { Injectable } from '@nestjs/common';


@Injectable()
export class EventRouterService {

  route(
    type: string,
  ) {

    return {
      eventType: type,
      routed: true,
    };

  }

}
TS


cat > src/platform/events/event-history.service.ts <<'TS'
import { Injectable } from '@nestjs/common';


@Injectable()
export class EventHistoryService {

  record(
    eventId: string,
  ) {

    return {
      eventId,
      recordedAt: new Date(),
    };

  }

}
TS


mkdir -p test/platform/events


cat > test/platform/events/event-bus.service.test.ts <<'TS'
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { EventBusService } from '../../../src/platform/events/event-bus.service';


describe('EventBusService', () => {

  it('publishes platform events', () => {

    const service =
      new EventBusService();


    const result =
      service.publish({
        id: 'event-1',
        type: 'health.check',
        payload: {},
        createdAt: new Date(),
      });


    assert.equal(
      result.type,
      'health.check',
    );

  });

});
TS


cd ../..

rm -rf services/api/dist

pnpm --filter @neighbour/api run lint
pnpm --filter @neighbour/api run test
pnpm --filter @neighbour/api run build

echo "🎉 BUILD 0050 COMPLETE"

