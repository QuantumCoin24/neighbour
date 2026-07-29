import assert from 'node:assert/strict';
import type {
  ClientHttp2Session,
  ClientSessionOptions,
  SecureClientSessionOptions,
} from 'node:http2';
import { describe, it } from 'node:test';

import {
  ApnsHttp2ClientService,
  type ApnsHttp2Connect,
} from '../src/notification/transport/apns-http2-client.service';

describe('ApnsHttp2ClientService', () => {
  it('creates a secure HTTP/2 session for an APNs authority', () => {
    let receivedAuthority: string | undefined;
    let receivedOptions: ClientSessionOptions | SecureClientSessionOptions | undefined;

    const session = {
      closed: false,
      destroyed: false,
    } as ClientHttp2Session;

    const connectSession: ApnsHttp2Connect = (authority, options) => {
      receivedAuthority = authority;
      receivedOptions = options;

      return session;
    };

    const service = new ApnsHttp2ClientService(connectSession);
    const result = service.connect('api.sandbox.push.apple.com');

    assert.equal(receivedAuthority, 'https://api.sandbox.push.apple.com');
    assert.equal(receivedOptions?.peerMaxConcurrentStreams, 100);
    assert.equal(result, session);
  });

  it('preserves an existing HTTPS endpoint', () => {
    let receivedAuthority: string | undefined;

    const connectSession: ApnsHttp2Connect = (authority) => {
      receivedAuthority = authority;

      return {} as ClientHttp2Session;
    };

    const service = new ApnsHttp2ClientService(connectSession);

    service.connect('https://api.push.apple.com');

    assert.equal(receivedAuthority, 'https://api.push.apple.com');
  });

  it('rejects an empty APNs authority', () => {
    const service = new ApnsHttp2ClientService(
      (() => ({}) as ClientHttp2Session) as ApnsHttp2Connect,
    );

    assert.throws(() => service.connect('   '), /APNs authority must not be empty/);
  });
});
