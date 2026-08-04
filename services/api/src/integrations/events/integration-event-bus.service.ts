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
  private listeners: ((event: IntegrationEvent) => void)[] = [];

  subscribe(listener: (event: IntegrationEvent) => void) {
    this.listeners.push(listener);
  }

  publish(event: IntegrationEvent) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
