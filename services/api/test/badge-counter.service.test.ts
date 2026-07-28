import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { BadgeCounterService } from '../src/notification/badge/badge-counter.service';

describe('BadgeCounterService', () => {
  it('increments badge counts', () => {
    const service = new BadgeCounterService();

    assert.equal(service.increment('user-1'), 1);
    assert.equal(service.increment('user-1'), 2);
    assert.equal(service.get('user-1'), 2);
  });

  it('never decrements below zero', () => {
    const service = new BadgeCounterService();

    assert.equal(service.decrement('user-1'), 0);

    service.increment('user-1');

    assert.equal(service.decrement('user-1'), 0);
  });

  it('clears badge counts', () => {
    const service = new BadgeCounterService();

    service.increment('user-1');
    service.increment('user-1');

    service.clear('user-1');

    assert.equal(service.get('user-1'), 0);
  });
});
