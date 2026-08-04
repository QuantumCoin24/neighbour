import { Injectable } from '@nestjs/common';

import { IntegrationService } from './registry/integration.service';
import { ConnectorService } from './connectors/connector.service';
import { WebhookService } from './webhooks/webhook.service';
import { IntegrationEventBusService } from './events/integration-event-bus.service';

import type { IntegrationEntity } from './registry/integration.entity';
import type { ConnectorEntity } from './connectors/connector.entity';
import type { WebhookEntity } from './webhooks/webhook.entity';

@Injectable()
export class IntegrationEngineService {
  constructor(
    private readonly integrations: IntegrationService,

    private readonly connectors: ConnectorService,

    private readonly webhooks: WebhookService,

    private readonly events: IntegrationEventBusService,
  ) {}

  register(integration: IntegrationEntity) {
    const created = this.integrations.register(integration);

    return created;
  }

  connect(connector: ConnectorEntity) {
    const created = this.connectors.create(connector);

    this.events.publish({
      type: 'integration.connected',

      integrationId: connector.integrationId,
    });

    return created;
  }

  receiveWebhook(webhook: WebhookEntity) {
    const received = this.webhooks.receive(webhook);

    this.events.publish({
      type: 'webhook.received',

      webhookId: webhook.id,
    });

    return received;
  }
}
