import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { PresenceRegistry } from '../src/realtime/presence/presence.registry';

describe('PresenceRegistry', () => {
  let registry: PresenceRegistry;

  beforeEach(() => {
    registry = new PresenceRegistry();
  });

  it('marks the first socket as the user becoming online', () => {
    const becameOnline = registry.register('user-123', 'socket-1');

    assert.equal(becameOnline, true);
    assert.equal(registry.isOnline('user-123'), true);
    assert.equal(registry.getConnectionCount('user-123'), 1);
    assert.equal(registry.getUserId('socket-1'), 'user-123');
  });

  it('supports multiple sockets for one user', () => {
    registry.register('user-123', 'socket-1');

    const becameOnline = registry.register('user-123', 'socket-2');

    assert.equal(becameOnline, false);
    assert.equal(registry.getConnectionCount('user-123'), 2);

    assert.deepEqual(registry.getSocketIds('user-123').sort(), ['socket-1', 'socket-2']);
  });

  it('keeps the user online while another socket remains', () => {
    registry.register('user-123', 'socket-1');
    registry.register('user-123', 'socket-2');

    const result = registry.unregister('socket-1');

    assert.deepEqual(result, {
      userId: 'user-123',
      becameOffline: false,
    });

    assert.equal(registry.isOnline('user-123'), true);
  });

  it('marks the user offline after the final socket leaves', () => {
    registry.register('user-123', 'socket-1');

    const result = registry.unregister('socket-1');

    assert.deepEqual(result, {
      userId: 'user-123',
      becameOffline: true,
    });

    assert.equal(registry.isOnline('user-123'), false);
  });

  it('handles unknown sockets safely', () => {
    assert.deepEqual(registry.unregister('unknown-socket'), {
      userId: null,
      becameOffline: false,
    });
  });

  it('clears all presence records', () => {
    registry.register('user-1', 'socket-1');
    registry.register('user-2', 'socket-2');

    registry.clear();

    assert.deepEqual(registry.getOnlineUserIds(), []);
    assert.equal(registry.getUserId('socket-1'), null);
    assert.equal(registry.getUserId('socket-2'), null);
  });
});
