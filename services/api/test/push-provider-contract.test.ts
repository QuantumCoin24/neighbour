import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  PushDeliveryRequest,
  PushDeliveryResponse,
  PushProvider,
} from '../src/notification/provider/push-provider.interface';

class TestPushProvider implements PushProvider {
  readonly name = 'apns' as const;

  async send(request: PushDeliveryRequest): Promise<PushDeliveryResponse> {
    return Promise.resolve({
      provider: this.name,
      success: true,
      status: 200,
      providerRequestId: request.id,
    });
  }
}

describe('PushProvider contract', () => {
  it('supports a provider-independent delivery request', async () => {
    const provider = new TestPushProvider();

    const result = await provider.send({
      id: 'notification-1',
      deviceToken: 'device-token',
      payload: {
        aps: {
          alert: 'Hello from Neighbour',
        },
      },
    });

    assert.deepEqual(result, {
      provider: 'apns',
      success: true,
      status: 200,
      providerRequestId: 'notification-1',
    });
  });
});
