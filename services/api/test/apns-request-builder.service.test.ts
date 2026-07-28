import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ApnsHeaderBuilderService } from '../src/notification/headers/apns-header-builder.service';
import { NotificationExpirationService } from '../src/notification/expiry/notification-expiration.service';
import { NotificationPriorityService } from '../src/notification/priority/notification-priority.service';
import { NotificationTopicService } from '../src/notification/topic/notification-topic.service';
import { ApnsRequestBuilderService } from '../src/notification/request/apns-request-builder.service';

describe('ApnsRequestBuilderService', () => {
  it('builds a complete APNs request', () => {
    const service = new ApnsRequestBuilderService(
      new ApnsHeaderBuilderService(
        new NotificationTopicService('com.neighbour.test'),
        new NotificationPriorityService(),
        new NotificationExpirationService(),
      ),
    );

    const payload = {
      aps: {
        alert: {
          title: 'Neighbour',
          body: 'Hello',
        },
      },
    };

    const request = service.build('device-token', payload);

    assert.equal(request.deviceToken, 'device-token');
    assert.equal(request.headers['apns-topic'], 'com.neighbour.test');
    assert.deepEqual(request.payload, payload);
  });
});
