import assert from 'node:assert/strict';

import { describe, it } from 'node:test';

import { ActivationPlanService } from '../../../src/platform/activation/activation-plan.service';

describe('ActivationPlanService', () => {
  it('creates activation plans', () => {
    const service = new ActivationPlanService();

    const result = service.create({
      domain: 'trust',

      currentState: 'FOUNDATION',

      requiredAction: 'MODULE_ACTIVATION',

      priority: 'HIGH',

      launchImpact: 'SAFETY',
    });

    assert.equal(result.domain, 'trust');
  });
});
