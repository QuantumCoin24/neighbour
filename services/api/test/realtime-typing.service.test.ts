import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { TypingService } from '../src/realtime/activity/typing.service';

describe('TypingService', () => {
  let service: TypingService;

  beforeEach(() => {
    service = new TypingService();
  });

  it('starts a typing state', () => {
    const state = service.start('conversation-123', 'user-123', 'socket-123', () => undefined);

    assert.equal(state.conversationId, 'conversation-123');
    assert.equal(state.userId, 'user-123');
    assert.equal(state.socketId, 'socket-123');
    assert.equal(state.typing, true);
    assert.equal(typeof state.changedAt, 'string');

    service.stop('conversation-123', 'socket-123');
  });

  it('stops an active typing state', () => {
    service.start('conversation-123', 'user-123', 'socket-123', () => undefined);

    const state = service.stop('conversation-123', 'socket-123');

    assert.notEqual(state, null);
    assert.equal(state?.typing, false);
    assert.equal(state?.conversationId, 'conversation-123');
    assert.equal(state?.userId, 'user-123');
  });

  it('returns null when no typing state exists', () => {
    assert.equal(service.stop('conversation-123', 'unknown-socket'), null);
  });

  it('replaces an existing typing timeout safely', () => {
    service.start('conversation-123', 'user-123', 'socket-123', () => undefined);

    const replacement = service.start(
      'conversation-123',
      'user-123',
      'socket-123',
      () => undefined,
    );

    assert.equal(replacement.typing, true);

    service.stop('conversation-123', 'socket-123');
  });

  it('clears every typing state owned by a socket', () => {
    service.start('conversation-1', 'user-123', 'socket-123', () => undefined);

    service.start('conversation-2', 'user-123', 'socket-123', () => undefined);

    const states = service.stopAllForSocket('socket-123');

    assert.equal(states.length, 2);
    assert.equal(
      states.every((state) => state.typing === false),
      true,
    );

    assert.equal(service.stop('conversation-1', 'socket-123'), null);
  });
});
