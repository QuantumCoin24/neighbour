import { Injectable } from '@nestjs/common';

import { ApnsRequestBuilderService } from '../request/apns-request-builder.service';
import { ApnsPayload } from '../push/apns-payload.interface';

@Injectable()
export class ApnsHttpRequestFactoryService {
  constructor(private readonly builder: ApnsRequestBuilderService) {}

  create(deviceToken: string, payload: ApnsPayload, background = false) {
    const request = this.builder.build(deviceToken, payload, background);

    return {
      method: 'POST',
      path: `/3/device/${deviceToken}`,
      ...request,
    };
  }
}
