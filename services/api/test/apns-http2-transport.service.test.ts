import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ApnsHttp2TransportService } from '../src/notification/transport/apns-http2-transport.service';

describe('ApnsHttp2TransportService', () => {
  it('creates an HTTP/2 request on the managed session', async () => {
    let receivedHeaders: Record<string, unknown> = {};

    const sessionManager = {
      getSession() {
        return {
          request(headers: Record<string, unknown>) {
            receivedHeaders = headers;

            return {
              close() {},
            };
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
      payload: {},
    });

    assert.equal(receivedHeaders[':path'], '/3/device/device-token');
    assert.equal(result.accepted, true);
    assert.equal(result.status, 200);
  });
});
