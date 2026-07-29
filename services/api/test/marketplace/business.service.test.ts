import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { BusinessService } from '../../src/marketplace/business/business.service';

describe('BusinessService', () => {
  it('creates businesses', async () => {
    const service = new BusinessService({
      save(item: unknown) {
        return Promise.resolve(item);
      },
    } as never);

    const result = await service.create({
      id: 'business-1',
      communityId: 'community-1',
      ownerId: 'user-1',
      name: 'Local Cafe',
      description: 'Community cafe',
      category: 'Food',
      createdAt: new Date(),
    });

    assert.equal(result.name, 'Local Cafe');
  });
});
