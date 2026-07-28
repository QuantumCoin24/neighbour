import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { NotificationDeliveryAuditService } from '../src/notification/audit/notification-delivery-audit.service';

describe('NotificationDeliveryAuditService', () => {
  it('records audit entries', () => {
    const service = new NotificationDeliveryAuditService();

    service.record('notification-1', 'queued');
    service.record('notification-1', 'delivered');

    const entries = service.list();

    assert.equal(entries.length, 2);

    const firstEntry = entries[0];
    const secondEntry = entries[1];

    assert.ok(firstEntry);
    assert.ok(secondEntry);
    assert.equal(firstEntry.event, 'queued');
    assert.equal(secondEntry.event, 'delivered');
  });

  it('clears the audit log', () => {
    const service = new NotificationDeliveryAuditService();

    service.record('notification-1', 'failed');
    service.clear();

    assert.equal(service.list().length, 0);
  });
});
