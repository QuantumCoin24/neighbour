import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { RuleEngineService } from '../../../src/platform/intelligence/rules/rule-engine.service';

describe('RuleEngineService', () => {
  it('creates warning state', () => {
    const service = new RuleEngineService();

    const result = service.evaluate(20);

    assert.equal(result, 'warning');
  });
});
