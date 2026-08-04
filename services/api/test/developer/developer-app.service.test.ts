import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DeveloperAppService } from '../../src/developer/apps/developer-app.service';

describe('DeveloperAppService', () => {
  it('creates developer applications', () => {
    const service = new DeveloperAppService();

    const result = service.create({
      id: 'app-1',
      ownerId: 'developer-1',
      name: 'Neighbour Partner App',
      status: 'active',
      createdAt: new Date(),
    });

    assert.equal(result.status, 'active');
  });
});
