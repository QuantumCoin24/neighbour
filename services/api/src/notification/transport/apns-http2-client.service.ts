import {
  connect,
  type ClientHttp2Session,
  type ClientSessionOptions,
  type SecureClientSessionOptions,
} from 'node:http2';

import { Injectable } from '@nestjs/common';

export type ApnsHttp2Connect = (
  authority: string,
  options?: ClientSessionOptions | SecureClientSessionOptions,
) => ClientHttp2Session;

@Injectable()
export class ApnsHttp2ClientService {
  constructor(private readonly connectSession: ApnsHttp2Connect = connect) {}

  connect(authority: string): ClientHttp2Session {
    const endpoint = this.toEndpoint(authority);

    return this.connectSession(endpoint, {
      peerMaxConcurrentStreams: 100,
    });
  }

  private toEndpoint(authority: string): string {
    const trimmed = authority.trim();

    if (trimmed.length === 0) {
      throw new Error('APNs authority must not be empty');
    }

    if (trimmed.startsWith('https://')) {
      return trimmed;
    }

    return `https://${trimmed}`;
  }
}
