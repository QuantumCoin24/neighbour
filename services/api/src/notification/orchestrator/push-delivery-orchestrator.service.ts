import { Injectable } from '@nestjs/common';

import type {
  PushDeliveryRequest,
  PushDeliveryResponse,
  PushProvider,
} from '../provider/push-provider.interface';

@Injectable()
export class PushDeliveryOrchestratorService {
  constructor(private readonly provider: PushProvider) {}

  async deliver(request: PushDeliveryRequest): Promise<PushDeliveryResponse> {
    return this.provider.send(request);
  }
}
