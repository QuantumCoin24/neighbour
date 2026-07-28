import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { NotificationDeliveryLifecycleService } from '../src/notification/lifecycle/notification-delivery-lifecycle.service';

describe('NotificationDeliveryLifecycleService', () => {
  it('tracks lifecycle transitions', () => {
    const service = new NotificationDeliveryLifecycleService();

    service.set('notification-1', 'queued');
    assert.equal(service.get('notification-1'), 'queued');

    service.set('notification-1', 'sending');
    assert.equal(service.get('notification-1'), 'sending');

    service.set('notification-1', 'delivered');
    assert.equal(service.get('notification-1'), 'delivered');
  });

  it('clears lifecycle state', () => {
    const service = new NotificationDeliveryLifecycleService();

    service.set('notification-1', 'failed');
    service.clear('notification-1');

    assert.equal(service.get('notification-1'), undefined);
  });
});
