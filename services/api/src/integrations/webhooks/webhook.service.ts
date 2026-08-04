import { Injectable } from '@nestjs/common';

import type { WebhookEntity } from './webhook.entity';

@Injectable()
export class WebhookService {
  private webhooks: WebhookEntity[] = [];

  receive(webhook: WebhookEntity): WebhookEntity {
    this.webhooks.push(webhook);

    return webhook;
  }

  list(): WebhookEntity[] {
    return this.webhooks;
  }
}
