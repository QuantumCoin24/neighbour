import assert from 'node:assert/strict';
import type { ClientHttp2Session } from 'node:http2';
import { describe, it } from 'node:test';

import { ApnsHttp2ClientService } from '../src/notification/transport/apns-http2-client.service';
import { ApnsSessionManagerService } from '../src/notification/transport/apns-session-manager.service';

interface MutableSessionState {
  closed: boolean;
  destroyed: boolean;
  close(): void;
}

function createSession(): ClientHttp2Session {
  const state: MutableSessionState = {
    closed: false,
    destroyed: false,
    close() {
      state.closed = true;
    },
  };

  return state as unknown as ClientHttp2Session;
}

describe('ApnsSessionManagerService', () => {
  it('reuses an existing session', () => {
    let connections = 0;
    const session = createSession();

    const client = {
      connect() {
        connections += 1;
        return session;
      },
    } as unknown as ApnsHttp2ClientService;

    const manager = new ApnsSessionManagerService(client);

    const first = manager.getSession('api.push.apple.com');
    const second = manager.getSession('api.push.apple.com');

    assert.equal(first, second);
    assert.equal(connections, 1);
  });

  it('creates a new session after close()', () => {
    let connections = 0;

    const client = {
      connect() {
        connections += 1;
        return createSession();
      },
    } as unknown as ApnsHttp2ClientService;

    const manager = new ApnsSessionManagerService(client);

    manager.getSession('api.push.apple.com');
    manager.close();
    manager.getSession('api.push.apple.com');

    assert.equal(connections, 2);
  });

  it('replaces a destroyed session', () => {
    let connections = 0;
    const firstSession = createSession();

    const client = {
      connect() {
        connections += 1;

        if (connections === 1) {
          return firstSession;
        }

        return createSession();
      },
    } as unknown as ApnsHttp2ClientService;

    const manager = new ApnsSessionManagerService(client);

    const first = manager.getSession('api.push.apple.com');

    Object.defineProperty(first, 'destroyed', {
      configurable: true,
      value: true,
    });

    const second = manager.getSession('api.push.apple.com');

    assert.notEqual(first, second);
    assert.equal(connections, 2);
  });
});
