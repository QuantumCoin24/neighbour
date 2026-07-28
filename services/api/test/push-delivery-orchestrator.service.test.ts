import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { PushDeliveryOrchestratorService } from '../src/notification/orchestrator/push-delivery-orchestrator.service';
import { ApnsHttp2TransportService } from '../src/notification/transport/apns-http2-transport.service';

class FakeTransport {
  async send() {
    return {
      status: 200,
      accepted: true,
      endpoint: 'https://api.sandbox.push.apple.com',
    };
  }
}

describe('PushDeliveryOrchestratorService', () => {
  it('delegates delivery to the APNs transport', async () => {
    const service = new PushDeliveryOrchestratorService(
      new FakeTransport() as unknown as ApnsHttp2TransportService,
    );

    const result = await service.deliver({
      id: 'delivery-123',
      deviceToken: 'device-token',
      payload: {
        aps: {
          alert: 'Hello',
        },
      },
    });

    assert.deepEqual(result, {
      provider: 'apns',
      success: true,
      status: 200,
      providerRequestId: 'delivery-123',
    });
  });
});
