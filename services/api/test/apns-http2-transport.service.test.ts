import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { describe, it } from 'node:test';

import { ApnsErrorClassifierService } from '../src/notification/transport/apns-error-classifier.service';
import { ApnsHttp2TransportService } from '../src/notification/transport/apns-http2-transport.service';
import { ApnsResponseParserService } from '../src/notification/transport/apns-response-parser.service';
import { ApnsRetryPolicyService } from '../src/notification/transport/apns-retry-policy.service';

describe('ApnsHttp2TransportService', () => {
  it('writes the payload and enriches a successful APNs response', async () => {
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

    const service = new ApnsHttp2TransportService(
      requestBuilder as never,
      sessionManager as never,
      new ApnsResponseParserService(),
      new ApnsErrorClassifierService(),
      new ApnsRetryPolicyService(),
    );

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
    assert.deepEqual(result, {
      status: 200,
      accepted: true,
      endpoint: 'https://api.sandbox.push.apple.com/3/device/device-token',
      classification: 'success',
      retryable: false,
    });
  });

  it('marks temporary APNs failures as retryable', async () => {
    class FakeStream extends EventEmitter {
      end() {
        this.emit('response', {
          ':status': 503,
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

    const responseParser = {
      parse(status: number) {
        return {
          status,
          accepted: false,
          reason: 'ServiceUnavailable',
        };
      },
    };

    const service = new ApnsHttp2TransportService(
      requestBuilder as never,
      sessionManager as never,
      responseParser as never,
      new ApnsErrorClassifierService(),
      new ApnsRetryPolicyService(),
    );

    const result = await service.send({
      deviceToken: 'device-token',
      headers: {},
      payload: {
        aps: {
          alert: 'Hello',
        },
      },
    });

    assert.equal(result.status, 503);
    assert.equal(result.accepted, false);
    assert.equal(result.classification, 'temporary');
    assert.equal(result.retryable, true);
    assert.equal(result.reason, 'ServiceUnavailable');
  });
});
