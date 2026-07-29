import { Injectable } from '@nestjs/common';

import type { NotificationDeliveryAuditEvent } from './notification-delivery-audit-mapper.service';
import type { NotificationDeliveryEventHandler } from './notification-delivery-event-bus.service';
import { NotificationDeliveryEventDispatcherService } from './notification-delivery-event-dispatcher.service';
import { NotificationDeliveryEventListenerRegistryService } from './notification-delivery-event-listener-registry.service';

@Injectable()
export class NotificationDeliveryEventPipelineService {
  constructor(
    private readonly dispatcher: NotificationDeliveryEventDispatcherService,
    private readonly registry: NotificationDeliveryEventListenerRegistryService,
  ) {}

  register(handler: NotificationDeliveryEventHandler): () => void {
    return this.registry.register(handler);
  }

  publish(event: NotificationDeliveryAuditEvent): void {
    this.dispatcher.dispatch(event);
  }
}
