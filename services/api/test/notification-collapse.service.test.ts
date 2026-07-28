import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { NotificationCollapseService } from '../src/notification/collapse/notification-collapse.service';

describe('NotificationCollapseService', () => {
  it('creates deterministic collapse identifiers', () => {
    const service = new NotificationCollapseService();

    assert.equal(service.build('message', 'conversation-123'), 'message:conversation-123');
  });

  it('limits identifiers to APNs maximum length', () => {
    const service = new NotificationCollapseService();

    const value = service.build('notification', 'x'.repeat(200));

    assert.ok(value.length <= 64);
  });
});
