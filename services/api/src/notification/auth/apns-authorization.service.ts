import { Injectable } from '@nestjs/common';

import { AppleJwtSignerService } from './apple-jwt-signer.service';

@Injectable()
export class ApnsAuthorizationService {
  constructor(private readonly signer: AppleJwtSignerService) {}

  createAuthorizationHeader(now = new Date()): string {
    return `bearer ${this.signer.sign(now)}`;
  }
}
