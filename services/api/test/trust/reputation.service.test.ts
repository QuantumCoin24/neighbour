import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ReputationService } from '../../src/trust/reputation/reputation.service';

describe('ReputationService', () => {
  it('stores reputation records', () => {
    const service = new ReputationService();

    const result = service.create({
      id: 'rep-1',
      userId: 'user-1',
      score: 10,
      contributions: 2,
      recommendations: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    assert.equal(result.score, 10);
  });
});
