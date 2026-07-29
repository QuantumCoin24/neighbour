import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { AccessService } from '../../src/security/access/access.service';

describe('AccessService', () => {
  it('grants resource access', () => {
    const service = new AccessService();

    service.grant({
      id: 'permission-1',
      subjectId: 'user-1',
      resource: 'profile',
      action: 'view',
      granted: true,
      createdAt: new Date(),
    });

    assert.equal(service.canAccess('user-1', 'profile', 'view'), true);
  });
});
