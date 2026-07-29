#!/bin/bash

set -e

echo "🚀 BUILD 0041 — Integrations Partner Platform Engine"

cd services/api

mkdir -p src/integrations/registry
mkdir -p src/integrations/connectors
mkdir -p src/integrations/webhooks
mkdir -p src/integrations/events


# =====================================
# INTEGRATION REGISTRY
# =====================================

cat > src/integrations/registry/integration.entity.ts <<'TS'
export interface IntegrationEntity {
  id: string;
  name: string;
  provider: string;
  status:
    | 'connected'
    | 'disconnected'
    | 'failed';
  createdAt: Date;
}
TS


cat > src/integrations/registry/integration.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { IntegrationEntity } from './integration.entity';


@Injectable()
export class IntegrationService {

  private integrations:
    IntegrationEntity[] = [];


  register(
    integration: IntegrationEntity,
  ): IntegrationEntity {

    this.integrations.push(
      integration,
    );

    return integration;
  }


  findAll(): IntegrationEntity[] {
    return this.integrations;
  }


  findByName(
    name: string,
  ): IntegrationEntity | undefined {

    return this.integrations.find(
      (item) =>
        item.name === name,
    );
  }

}
TS


# =====================================
# CONNECTOR FRAMEWORK
# =====================================

cat > src/integrations/connectors/connector.entity.ts <<'TS'
export interface ConnectorEntity {
  id: string;
  integrationId: string;
  endpoint: string;
  active: boolean;
  createdAt: Date;
}
TS


cat > src/integrations/connectors/connector.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { ConnectorEntity } from './connector.entity';


@Injectable()
export class ConnectorService {

  private connectors:
    ConnectorEntity[] = [];


  create(
    connector: ConnectorEntity,
  ): ConnectorEntity {

    this.connectors.push(
      connector,
    );

    return connector;
  }


  findByIntegration(
    integrationId: string,
  ): ConnectorEntity[] {

    return this.connectors.filter(
      (item) =>
        item.integrationId === integrationId,
    );
  }

}
TS


# =====================================
# WEBHOOK ENGINE
# =====================================

cat > src/integrations/webhooks/webhook.entity.ts <<'TS'
export interface WebhookEntity {
  id: string;
  integrationId: string;
  event: string;
  receivedAt: Date;
}
TS


cat > src/integrations/webhooks/webhook.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { WebhookEntity } from './webhook.entity';


@Injectable()
export class WebhookService {

  private webhooks:
    WebhookEntity[] = [];


  receive(
    webhook: WebhookEntity,
  ): WebhookEntity {

    this.webhooks.push(webhook);

    return webhook;
  }


  list(): WebhookEntity[] {
    return this.webhooks;
  }

}
TS


# =====================================
# INTEGRATION EVENTS
# =====================================

cat > src/integrations/events/integration-event-bus.service.ts <<'TS'
import { Injectable } from '@nestjs/common';


export type IntegrationEvent =
  | {
      type: 'integration.connected';
      integrationId: string;
    }
  | {
      type: 'integration.failed';
      integrationId: string;
    }
  | {
      type: 'webhook.received';
      webhookId: string;
    };


@Injectable()
export class IntegrationEventBusService {

  private listeners:
    ((event: IntegrationEvent) => void)[] = [];


  subscribe(
    listener: (event: IntegrationEvent) => void,
  ) {

    this.listeners.push(listener);

  }


  publish(
    event: IntegrationEvent,
  ) {

    for (const listener of this.listeners) {
      listener(event);
    }

  }

}
TS


# =====================================
# TEST
# =====================================

mkdir -p test/integrations

cat > test/integrations/integration.service.test.ts <<'TS'
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { IntegrationService } from '../../src/integrations/registry/integration.service';


describe('IntegrationService', () => {

  it('registers integrations', () => {

    const service =
      new IntegrationService();


    const result =
      service.register({
        id: 'integration-1',
        name: 'Maps',
        provider: 'Provider',
        status: 'connected',
        createdAt: new Date(),
      });


    assert.equal(
      result.status,
      'connected',
    );

  });

});
TS


cd ../..

pnpm exec prettier --write .
pnpm --filter @neighbour/api run lint
pnpm --filter @neighbour/api run test
pnpm --filter @neighbour/api run build

echo "🎉 BUILD 0041 COMPLETE"

