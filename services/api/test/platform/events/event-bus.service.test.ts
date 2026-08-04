import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { EventBusService } from '../../../src/platform/events/event-bus.service';

describe('EventBusService', () => {
  it('publishes platform events', () => {
    const service = new EventBusService();

    const result = service.publish({
      id: 'event-1',
      type: 'health.check',
      payload: {},
      createdAt: new Date(),
    });

    assert.equal(result.type, 'health.check');
  });
});
