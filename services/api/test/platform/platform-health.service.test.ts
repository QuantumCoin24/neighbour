import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { PlatformHealthService } from '../../src/platform/platform-health.service';

describe('PlatformHealthService', () => {
  it('returns healthy status', () => {
    const service = new PlatformHealthService();

    const result = service.status();

    assert.equal(result.status, 'healthy');
  });
});
