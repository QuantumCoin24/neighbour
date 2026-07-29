import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ProfileDiscoveryService } from '../src/profile/discovery/profile-discovery.service';


describe('ProfileDiscoveryService', () => {

  it('calculates profile completion score', async () => {

    const service =
      new ProfileDiscoveryService({
        findByUsername() {
          return Promise.resolve({
            id: '1',
            userId: 'user-1',
            username: 'jason',
            displayName: 'Jason',
            avatarUrl: 'avatar',
            bio: 'hello',
            localArea: 'Manchester',
            showLocalArea: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        },
      } as never);


    const result =
      await service.findByUsername('jason');


    assert.equal(
      result?.completionScore,
      100,
    );

  });

});
