import { Injectable } from '@nestjs/common';

import type {
  PushDeliveryRequest,
  PushDeliveryResponse,
} from '../provider/push-provider.interface';
import { ApnsHttp2TransportService } from '../transport/apns-http2-transport.service';

@Injectable()
export class PushDeliveryOrchestratorService {
  constructor(private readonly transport: ApnsHttp2TransportService) {}

  async deliver(request: PushDeliveryRequest): Promise<PushDeliveryResponse> {
    const response = await this.transport.send({
      deviceToken: request.deviceToken,
      headers: {},
      payload: request.payload,
    });

    return {
      provider: 'apns',
      success: response.accepted,
      status: response.status,
      providerRequestId: request.id,
    };
  }
}
