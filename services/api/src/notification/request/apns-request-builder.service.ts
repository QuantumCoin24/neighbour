import { Injectable } from '@nestjs/common';

import { ApnsHeaderBuilderService } from '../headers/apns-header-builder.service';
import { ApnsPayload } from '../push/apns-payload.interface';

@Injectable()
export class ApnsRequestBuilderService {
  constructor(private readonly headers: ApnsHeaderBuilderService) {}

  build(deviceToken: string, payload: ApnsPayload, background = false) {
    return {
      deviceToken,
      headers: this.headers.build(background),
      payload,
    };
  }
}
