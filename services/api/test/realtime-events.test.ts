import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  RealtimeEvents,
  type RealtimeEvent,
} from '../src/realtime/constants/realtime-events.constant';

describe('RealtimeEvents', () => {
  it('exposes unique realtime event names', () => {
    const events: RealtimeEvent[] = [
      RealtimeEvents.CONNECTION_READY,
      RealtimeEvents.HEARTBEAT,
      RealtimeEvents.HEARTBEAT_ACKNOWLEDGED,
      RealtimeEvents.PRESENCE_ONLINE,
      RealtimeEvents.PRESENCE_OFFLINE,
      RealtimeEvents.PRESENCE_CHANGED,
      RealtimeEvents.ROOM_JOIN,
      RealtimeEvents.ROOM_JOINED,
      RealtimeEvents.ROOM_LEAVE,
      RealtimeEvents.ROOM_LEFT,
      RealtimeEvents.TYPING_START,
      RealtimeEvents.TYPING_STOP,
      RealtimeEvents.MESSAGE_CREATED,
      RealtimeEvents.MESSAGE_UPDATED,
      RealtimeEvents.MESSAGE_DELETED,
      RealtimeEvents.MESSAGE_READ,
      RealtimeEvents.CONVERSATION_UPDATED,
      RealtimeEvents.NOTIFICATION_CREATED,
      RealtimeEvents.NOTIFICATION_READ,
    ];

    assert.equal(new Set(events).size, events.length);
  });

  it('preserves the public event contract', () => {
    assert.equal(RealtimeEvents.CONNECTION_READY, 'connection.ready');

    assert.equal(RealtimeEvents.ROOM_JOIN, 'room.join');
    assert.equal(RealtimeEvents.TYPING_START, 'typing.start');

    assert.equal(RealtimeEvents.HEARTBEAT_ACKNOWLEDGED, 'heartbeat.acknowledged');
  });
});
