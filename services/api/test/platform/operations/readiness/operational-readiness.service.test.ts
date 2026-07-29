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
