import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { RecommendationService } from '../../src/intelligence/recommendation/recommendation.service';

describe('RecommendationService', () => {
  it('ranks recommendations by score', () => {
    const service = new RecommendationService();

    const result = service.rank([
      {
        id: '1',
        userId: 'user',
        targetId: 'a',
        targetType: 'community',
        score: 10,
        createdAt: new Date(),
      },
      {
        id: '2',
        userId: 'user',
        targetId: 'b',
        targetType: 'event',
        score: 50,
        createdAt: new Date(),
      },
    ]);

    assert.ok(result[0]);
    assert.equal(result[0].score, 50);
  });
});
