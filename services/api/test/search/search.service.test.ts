import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { SearchService } from '../../src/search/search.service';

describe('SearchService', () => {
  it('finds indexed results', () => {
    const service = new SearchService();

    service.index({
      id: '1',
      query: 'Blackley Community',
      category: 'community',
      targetId: 'community-1',
      createdAt: new Date(),
    });

    const result = service.search('Blackley');

    assert.ok(result[0]);

    assert.equal(result[0].targetId, 'community-1');
  });
});
