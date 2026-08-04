import assert from 'node:assert/strict';

import { describe, it } from 'node:test';

import { EnvironmentReadinessService } from '../../../../src/platform/deployment/readiness/environment-readiness.service';

describe('EnvironmentReadinessService', () => {
  it('marks ready environments as available', () => {
    const service = new EnvironmentReadinessService();

    const result = service.check('READY');

    assert.equal(result.ready, true);
  });
});
