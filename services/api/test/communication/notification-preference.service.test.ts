import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { NotificationPreferenceService } from '../../src/communication/preferences/notification-preference.service';

describe('NotificationPreferenceService', () => {
  it('stores user notification preferences', () => {
    const service = new NotificationPreferenceService();

    const result = service.save({
      id: 'pref-1',
      userId: 'user-1',
      category: 'events',
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    assert.equal(result.enabled, true);
  });
});
