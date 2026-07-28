import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { NotificationExpirationService } from '../src/notification/expiry/notification-expiration.service';
import { ApnsHeaderBuilderService } from '../src/notification/headers/apns-header-builder.service';
import { NotificationPriorityService } from '../src/notification/priority/notification-priority.service';
import { ApnsRequestBuilderService } from '../src/notification/request/apns-request-builder.service';
import { NotificationTopicService } from '../src/notification/topic/notification-topic.service';
import { ApnsHttpRequestFactoryService } from '../src/notification/client/apns-http-request-factory.service';

describe('ApnsHttpRequestFactoryService', () => {
  it('creates an APNs HTTP request', () => {
    const service = new ApnsHttpRequestFactoryService(
      new ApnsRequestBuilderService(
        new ApnsHeaderBuilderService(
          new NotificationTopicService('com.neighbour.test'),
          new NotificationPriorityService(),
          new NotificationExpirationService(),
        ),
      ),
    );

    const request = service.create('device-token', {
      aps: {
        alert: {
          title: 'Neighbour',
          body: 'Hello',
        },
      },
    });

    assert.equal(request.method, 'POST');
    assert.equal(request.path, '/3/device/device-token');
    assert.equal(request.headers['apns-topic'], 'com.neighbour.test');
  });
});
