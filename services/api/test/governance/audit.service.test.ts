import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { AuditService } from '../../src/governance/audit/audit.service';

describe('AuditService', () => {
  it('records governance events', () => {
    const service = new AuditService();

    const result = service.record({
      id: 'audit-1',
      action: 'admin.login',
      actorId: 'admin-1',
      createdAt: new Date(),
    });

    assert.equal(result.action, 'admin.login');
  });
});
