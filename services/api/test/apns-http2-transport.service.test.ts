import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { describe, it } from 'node:test';

import { ApnsHttp2TransportService } from '../src/notification/transport/apns-http2-transport.service';

describe('ApnsHttp2TransportService', () => {
  it('writes the payload and resolves from APNs response headers', async () => {
    let written = '';

    class FakeStream extends EventEmitter {
      end(payload: string) {
        written = payload;

        this.emit('response', {
          ':status': 200,
        });
      }
    }

    const sessionManager = {
      getSession() {
        return {
          request() {
            return new FakeStream();
          },
        };
      },
    };

    const requestBuilder = {
      build() {
        return {
          authority: 'api.sandbox.push.apple.com',
          headers: {
            ':path': '/3/device/device-token',
            ':method': 'POST',
          },
        };
      },
    };

    const service = new ApnsHttp2TransportService(requestBuilder as never, sessionManager as never);

    const result = await service.send({
      deviceToken: 'device-token',
      headers: {},
      payload: {
        aps: {
          alert: 'Hello',
        },
      },
    });

    assert.match(written, /Hello/);
    assert.equal(result.status, 200);
    assert.equal(result.accepted, true);
  });
});
