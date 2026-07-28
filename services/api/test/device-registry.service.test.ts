import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DevicePlatform } from '../src/notification/device/device-platform.enum';
import { DeviceRegistryService } from '../src/notification/device/device-registry.service';

function createDevice(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const now = new Date();

  return {
    id: 'device-1',
    userId: 'user-1',
    platform: DevicePlatform.IOS,
    token: 'push-token-1',
    deviceName: 'Jason iPhone',
    registeredAt: now,
    lastSeenAt: now,
    revokedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('DeviceRegistryService', () => {
  it('persists a new device registration', async () => {
    const storedDevice = createDevice();
    let operation: Record<string, unknown> | undefined;

    const database = {
      pushDevice: {
        upsert: (input: Record<string, unknown>): Promise<Record<string, unknown>> => {
          operation = input;
          return Promise.resolve(storedDevice);
        },
      },
    };

    const service = new DeviceRegistryService(database as never);

    const result = await service.register('user-1', {
      platform: DevicePlatform.IOS,
      token: 'push-token-1',
      deviceName: 'Jason iPhone',
    });

    assert.deepEqual(operation?.where, {
      token: 'push-token-1',
    });

    assert.equal(result.id, 'device-1');
    assert.equal(result.userId, 'user-1');
    assert.equal(result.platform, DevicePlatform.IOS);
    assert.equal(result.token, 'push-token-1');
  });

  it('returns only active devices for a user', async () => {
    let operation: Record<string, unknown> | undefined;

    const database = {
      pushDevice: {
        findMany: (input: Record<string, unknown>): Promise<Record<string, unknown>[]> => {
          operation = input;
          return Promise.resolve([
            createDevice(),
            createDevice({
              id: 'device-2',
              token: 'push-token-2',
              platform: DevicePlatform.WEB,
            }),
          ]);
        },
      },
    };

    const service = new DeviceRegistryService(database as never);
    const devices = await service.getDevices('user-1');

    assert.deepEqual(operation?.where, {
      userId: 'user-1',
      revokedAt: null,
    });

    assert.equal(devices.length, 2);
    assert.equal(devices[1]?.platform, DevicePlatform.WEB);
  });

  it('soft-revokes one owned device token', async () => {
    let operation: Record<string, unknown> | undefined;

    const database = {
      pushDevice: {
        updateMany: (input: Record<string, unknown>): Promise<{ count: number }> => {
          operation = input;
          return Promise.resolve({
            count: 1,
          });
        },
      },
    };

    const service = new DeviceRegistryService(database as never);
    const removed = await service.unregister('user-1', 'push-token-1');

    assert.equal(removed, true);
    assert.deepEqual(operation?.where, {
      userId: 'user-1',
      token: 'push-token-1',
      revokedAt: null,
    });

    const data = operation?.data as {
      revokedAt?: unknown;
    };

    assert.equal(data.revokedAt instanceof Date, true);
  });

  it('reports when an owned token was not active', async () => {
    const database = {
      pushDevice: {
        updateMany: (): Promise<{ count: number }> =>
          Promise.resolve({
            count: 0,
          }),
      },
    };

    const service = new DeviceRegistryService(database as never);

    assert.equal(await service.unregister('user-1', 'unknown-token'), false);
  });

  it('revokes every active device owned by a user', async () => {
    const database = {
      pushDevice: {
        updateMany: (): Promise<{ count: number }> =>
          Promise.resolve({
            count: 3,
          }),
      },
    };

    const service = new DeviceRegistryService(database as never);

    assert.equal(await service.unregisterAll('user-1'), 3);
  });

  it('updates the last-seen timestamp of an active device', async () => {
    let operation: Record<string, unknown> | undefined;

    const database = {
      pushDevice: {
        updateMany: (input: Record<string, unknown>): Promise<{ count: number }> => {
          operation = input;
          return Promise.resolve({
            count: 1,
          });
        },
      },
    };

    const service = new DeviceRegistryService(database as never);
    const touched = await service.touch('user-1', 'push-token-1');

    assert.equal(touched, true);

    const data = operation?.data as {
      lastSeenAt?: unknown;
    };

    assert.equal(data.lastSeenAt instanceof Date, true);
  });
});
