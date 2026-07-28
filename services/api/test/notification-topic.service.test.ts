import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { NotificationTopicService } from '../src/notification/topic/notification-topic.service';

describe('NotificationTopicService', () => {
  it('returns the configured bundle identifier', () => {
    const service = new NotificationTopicService('com.neighbour.test');

    assert.equal(service.get(), 'com.neighbour.test');
  });

  it('uses the supplied constructor value consistently', () => {
    const service = new NotificationTopicService('com.neighbour.production');

    assert.equal(service.get(), 'com.neighbour.production');
  });
});
