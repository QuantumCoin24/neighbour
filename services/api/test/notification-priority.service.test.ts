import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { NotificationPriorityService } from '../src/notification/priority/notification-priority.service';

describe('NotificationPriorityService', () => {
  it('returns immediate priority', () => {
    const service = new NotificationPriorityService();

    assert.equal(service.immediate(), 10);
  });

  it('returns background priority', () => {
    const service = new NotificationPriorityService();

    assert.equal(service.background(), 5);
  });

  it('resolves priorities correctly', () => {
    const service = new NotificationPriorityService();

    assert.equal(service.resolve(false), 10);
    assert.equal(service.resolve(true), 5);
  });
});
