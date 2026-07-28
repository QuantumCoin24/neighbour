import { createSign } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { AppleJwtBuilderService } from './apple-jwt-builder.service';

@Injectable()
export class AppleJwtSignerService {
  constructor(private readonly builder: AppleJwtBuilderService) {}

  sign(now = new Date()): string {
    const jwt = this.builder.build(now);

    const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');

    const header = encode(jwt.header);
    const claims = encode(jwt.claims);

    const unsigned = `${header}.${claims}`;

    const signer = createSign('SHA256');
    signer.update(unsigned);
    signer.end();

    const signature = signer.sign(jwt.privateKey).toString('base64url');

    return `${unsigned}.${signature}`;
  }
}
