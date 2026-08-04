import { Module } from '@nestjs/common';

import { IntegrationEngineService } from './integration-engine.service';

import { IntegrationService } from './registry/integration.service';
import { ConnectorService } from './connectors/connector.service';
import { WebhookService } from './webhooks/webhook.service';
import { IntegrationEventBusService } from './events/integration-event-bus.service';

@Module({
  providers: [
    IntegrationEngineService,

    IntegrationService,

    ConnectorService,

    WebhookService,

    IntegrationEventBusService,
  ],

  exports: [IntegrationEngineService],
})
export class IntegrationsModule {}
