import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { PlatformStatusService } from '../../../src/platform/operations/status/platform-status.service';


describe('PlatformStatusService', () => {

  it('returns platform health status', () => {

    const service =
      new PlatformStatusService();


    const result =
      service.status();


    assert.equal(
      result.healthScore,
      100,
    );

  });

});
