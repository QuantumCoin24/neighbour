import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { HealthService } from '../src/health/health.service';

describe('HealthService', () => {
  it('returns the platform health payload', () => {
    const result = new HealthService().getHealth();

    assert.equal(result.service, 'neighbour-api');
    assert.equal(result.status, 'ok');
    assert.equal(result.version, '1.0.0-alpha.2');
    assert.equal(typeof result.timestamp, 'string');
    assert.equal(typeof result.uptimeSeconds, 'number');
  });
});
