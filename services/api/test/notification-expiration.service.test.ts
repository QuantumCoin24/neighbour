import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { NotificationExpirationService } from '../src/notification/expiry/notification-expiration.service';

describe('NotificationExpirationService', () => {
  it('supports immediate expiration', () => {
    const service = new NotificationExpirationService();

    assert.equal(service.immediate(), 0);
  });

  it('creates a future unix timestamp', () => {
    const service = new NotificationExpirationService();

    const now = Math.floor(Date.now() / 1000);
    const value = service.afterSeconds(60);

    assert.ok(value >= now + 60);
  });

  it('converts a date into unix seconds', () => {
    const service = new NotificationExpirationService();

    const date = new Date('2030-01-01T00:00:00Z');

    assert.equal(service.at(date), Math.floor(date.getTime() / 1000));
  });
});
