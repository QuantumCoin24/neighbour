import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ProfileService } from '../src/profile/profile.service';

describe('ProfileService', () => {
  it('creates profiles through repository', async () => {
    let stored: unknown;

    const service = new ProfileService(
      {
        save(profile: unknown) {
          stored = profile;
          return Promise.resolve(profile);
        },

        findById() {
          return Promise.resolve(undefined);
        },

        findByUserId() {
          return Promise.resolve(undefined);
        },

        findByUsername() {
          return Promise.resolve(undefined);
        },

        update(profile: unknown) {
          return Promise.resolve(profile);
        },
      } as never,
      {
        publish() {},
      } as never,
    );

    await service.create({
      id: 'profile-1',
      userId: 'user-1',
      username: 'jason',
      displayName: 'Jason',
      localArea: null,
      showLocalArea: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    assert.ok(stored);
  });
});
