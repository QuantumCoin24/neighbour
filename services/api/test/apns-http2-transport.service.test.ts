import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ApnsRequestBuilderService } from '../src/notification/transport/apns-request-builder.service';
import { ApnsHttp2TransportService } from '../src/notification/transport/apns-http2-transport.service';

class TestRequestBuilder {
  build(deviceToken: string) {
    return {
      authority: 'api.sandbox.push.apple.com',
      headers: {
        authorization: 'bearer signed.jwt.token',
        'apns-topic': 'com.neighbour.app',
        ':path': `/3/device/${deviceToken}`,
        ':method': 'POST',
      },
    };
  }
}

describe('ApnsHttp2TransportService', () => {
  it('creates a transport response from APNs request metadata', async () => {
    const service = new ApnsHttp2TransportService(
      new TestRequestBuilder() as unknown as ApnsRequestBuilderService,
    );

    const response = await service.send({
      deviceToken: 'device-token',
      headers: {},
      payload: {
        aps: {
          alert: 'Hello',
        },
      },
    });

    assert.deepEqual(response, {
      status: 200,
      accepted: true,
      endpoint: 'https://api.sandbox.push.apple.com/3/device/device-token',
    });
  });
});
