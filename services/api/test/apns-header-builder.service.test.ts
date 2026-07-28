import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ApnsHeaderBuilderService } from '../src/notification/headers/apns-header-builder.service';
import { NotificationExpirationService } from '../src/notification/expiry/notification-expiration.service';
import { NotificationPriorityService } from '../src/notification/priority/notification-priority.service';
import { NotificationTopicService } from '../src/notification/topic/notification-topic.service';

describe('ApnsHeaderBuilderService', () => {
  it('builds foreground APNs headers', () => {
    const service = new ApnsHeaderBuilderService(
      new NotificationTopicService('com.neighbour.test'),
      new NotificationPriorityService(),
      new NotificationExpirationService(),
    );

    assert.deepEqual(service.build(), {
      'apns-topic': 'com.neighbour.test',
      'apns-priority': '10',
      'apns-expiration': '0',
    });
  });

  it('builds background APNs headers', () => {
    const service = new ApnsHeaderBuilderService(
      new NotificationTopicService('com.neighbour.test'),
      new NotificationPriorityService(),
      new NotificationExpirationService(),
    );

    assert.equal(service.build(true)['apns-priority'], '5');
  });
});
