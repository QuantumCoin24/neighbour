import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { IntegrationHealthService } from '../../src/platform/verification/integration-health.service';

describe('IntegrationHealthService', () => {
  it('calculates platform health', () => {
    const service = new IntegrationHealthService();

    const result = service.score(5);

    assert.equal(result, 100);
  });
});
