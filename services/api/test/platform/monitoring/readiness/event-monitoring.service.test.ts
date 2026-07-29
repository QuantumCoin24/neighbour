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
