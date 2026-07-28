import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DevicePlatform } from '../src/notification/device/device-platform.enum';
import { PushNotificationService } from '../src/notification/push/push-notification.service';

describe('PushNotificationService', () => {
  it('delivers Apple push notifications to active iOS devices', async () => {
    const devices = {
      getDevices: () =>
        Promise.resolve([
          {
            id: 'ios-device',
            userId: 'user-1',
            platform: DevicePlatform.IOS,
            token: 'ios-token',
            deviceName: 'iPhone',
            registeredAt: new Date(),
            lastSeenAt: new Date(),
            revokedAt: null,
          },
          {
            id: 'web-device',
            userId: 'user-1',
            platform: DevicePlatform.WEB,
            token: 'web-token',
            deviceName: 'Safari',
            registeredAt: new Date(),
            lastSeenAt: new Date(),
            revokedAt: null,
          },
        ]),
    };

    const sentTokens: string[] = [];

    const apns = {
      send: (request: { deviceToken: string }) => {
        sentTokens.push(request.deviceToken);

        return Promise.resolve({
          accepted: true,
          statusCode: 200,
          apnsId: 'apns-id',
          reason: null,
          timestamp: null,
        });
      },
    };

    const service = new PushNotificationService(devices as never, apns as never);

    const deliveries = await service.sendToUser({
      userId: 'user-1',
      payload: {
        aps: {
          alert: {
            title: 'New message',
            body: 'You have a new message.',
          },
          sound: 'default',
        },
      },
    });

    assert.deepEqual(sentTokens, ['ios-token']);
    assert.equal(deliveries.length, 1);
    assert.equal(deliveries[0]?.deviceId, 'ios-device');
    assert.equal(deliveries[0]?.result.accepted, true);
  });

  it('returns no deliveries when no iOS device exists', async () => {
    const devices = {
      getDevices: () => Promise.resolve([]),
    };

    const apns = {
      send: () => {
        throw new Error('APNs should not be called.');
      },
    };

    const service = new PushNotificationService(devices as never, apns as never);

    const deliveries = await service.sendToUser({
      userId: 'user-1',
      payload: {
        aps: {
          alert: {
            title: 'Neighbour',
            body: 'Nothing to deliver.',
          },
        },
      },
    });

    assert.deepEqual(deliveries, []);
  });
});
