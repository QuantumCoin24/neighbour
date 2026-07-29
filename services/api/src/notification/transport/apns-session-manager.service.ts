import type { ClientHttp2Session } from 'node:http2';

import { Injectable } from '@nestjs/common';

import { ApnsHttp2ClientService } from './apns-http2-client.service';

@Injectable()
export class ApnsSessionManagerService {
  private session: ClientHttp2Session | null = null;

  constructor(private readonly client: ApnsHttp2ClientService) {}

  getSession(authority: string): ClientHttp2Session {
    if (this.session && !this.session.closed && !this.session.destroyed) {
      return this.session;
    }

    this.session = this.client.connect(authority);

    return this.session;
  }

  close(): void {
    if (!this.session) {
      return;
    }

    if (!this.session.closed && !this.session.destroyed) {
      this.session.close();
    }

    this.session = null;
  }
}
