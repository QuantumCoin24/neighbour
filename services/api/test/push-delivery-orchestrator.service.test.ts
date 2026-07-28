import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  PushDeliveryRequest,
  PushDeliveryResponse,
  PushProvider,
} from '../src/notification/provider/push-provider.interface';
import { PushDeliveryOrchestratorService } from '../src/notification/orchestrator/push-delivery-orchestrator.service';

class FakeProvider implements PushProvider {
  readonly name = 'apns' as const;

  async send(request: PushDeliveryRequest): Promise<PushDeliveryResponse> {
    return {
      provider: this.name,
      success: true,
      status: 200,
      providerRequestId: request.id,
    };
  }
}

describe('PushDeliveryOrchestratorService', () => {
  it('delegates delivery to the configured provider', async () => {
    const service = new PushDeliveryOrchestratorService(new FakeProvider());

    const result = await service.deliver({
      id: 'notification-1',
      deviceToken: 'device-token',
      payload: {
        aps: {
          alert: 'Neighbour',
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
