import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { BusinessService } from '../../src/marketplace/business/business.service';

describe('BusinessService', () => {
  it('creates businesses', async () => {
    const service = new BusinessService(
      {
        save(item: unknown) {
          return Promise.resolve(item);
        },
      } as never,
      {
        community: {
          findUnique() {
            return Promise.resolve({
              id: 'community-1',
              allowBusinesses: true,
              latitude: null,
              longitude: null,
              locationAccuracyM: null,
              addressLine1: null,
              addressLine2: null,
              city: null,
              postcode: null,
              locationVisibility: null,
            });
          },
        },
        membership: {
          findUnique() {
            return Promise.resolve({
              status: 'ACTIVE',
            });
          },
        },
      } as never,
    );

    const result = await service.create('user-1', {
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
