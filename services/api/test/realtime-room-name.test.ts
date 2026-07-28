import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { RoomNameFactory } from '../src/realtime/rooms/room-name.factory';

describe('RoomNameFactory', () => {
  it('creates deterministic user room names', () => {
    assert.equal(RoomNameFactory.user('user-123'), 'user:user-123');
  });

  it('creates deterministic conversation room names', () => {
    assert.equal(RoomNameFactory.conversation('conversation-123'), 'conversation:conversation-123');
  });

  it('creates deterministic platform room names', () => {
    assert.equal(RoomNameFactory.community('community-123'), 'community:community-123');

    assert.equal(RoomNameFactory.business('business-123'), 'business:business-123');

    assert.equal(RoomNameFactory.organisation('organisation-123'), 'organisation:organisation-123');

    assert.equal(RoomNameFactory.event('event-123'), 'event:event-123');
  });
});
