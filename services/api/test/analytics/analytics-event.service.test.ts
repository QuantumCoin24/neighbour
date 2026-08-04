import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { AnalyticsEventService } from '../../src/analytics/events/analytics-event.service';

describe('AnalyticsEventService', () => {
  it('records analytics events', () => {
    const service = new AnalyticsEventService();

    const result = service.record({
      id: 'event-1',
      type: 'user.created',
      actorId: 'user-1',
      createdAt: new Date(),
    });

    assert.equal(result.type, 'user.created');
  });
});
