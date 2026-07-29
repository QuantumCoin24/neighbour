#!/bin/bash

set -e

echo "🚀 BUILD 0059 — Launch Monitoring Framework"


mkdir -p services/api/src/platform/monitoring/readiness
mkdir -p services/api/test/platform/monitoring/readiness


echo "📋 Creating monitoring status entity"


cat > services/api/src/platform/monitoring/readiness/monitoring-status.entity.ts <<'TS'
export interface MonitoringStatusEntity {

  domain: string;

  events: string;

  alerts: string;

  response: string;

  status: string;

}
TS
echo "📋 Creating event monitoring service"


cat > services/api/src/platform/monitoring/readiness/event-monitoring.service.ts <<'TS'
import { Injectable } from '@nestjs/common';


@Injectable()
export class EventMonitoringService {


  check(
    events: string,
  ) {

    return {

      events,

      visible:
        events === 'READY',

      checkedAt: new Date(),

    };

  }


}
TS


echo "📋 Creating alert monitoring service"


cat > services/api/src/platform/monitoring/readiness/alert-monitoring.service.ts <<'TS'
import { Injectable } from '@nestjs/common';


@Injectable()
export class AlertMonitoringService {


  check(
    alerts: string,
  ) {

    return {

      alerts,

      visible:
        alerts === 'READY',

      checkedAt: new Date(),

    };

  }


}
TS


echo "📋 Creating response readiness service"


cat > services/api/src/platform/monitoring/readiness/response-readiness.service.ts <<'TS'
import { Injectable } from '@nestjs/common';


@Injectable()
export class ResponseReadinessService {


  check(
    response: string,
  ) {

    return {

      response,

      ready:
        response === 'READY',

      checkedAt: new Date(),

    };

  }


}
TS
echo "🧪 Creating launch monitoring tests"


cat > services/api/test/platform/monitoring/readiness/event-monitoring.service.test.ts <<'TS'
import assert from 'node:assert/strict';

import { describe, it } from 'node:test';

import { EventMonitoringService } from '../../../../src/platform/monitoring/readiness/event-monitoring.service';


describe('EventMonitoringService', () => {


  it('marks ready events as visible', () => {


    const service =
      new EventMonitoringService();


    const result =
      service.check(
        'READY',
      );


    assert.equal(
      result.visible,
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


echo "🎉 BUILD 0059 COMPLETE"
