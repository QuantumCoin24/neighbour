import { Injectable } from '@nestjs/common';

import {
  NotificationDeliveryEventBusService,
  type NotificationDeliveryEventHandler,
} from './notification-delivery-event-bus.service';

@Injectable()
export class NotificationDeliveryEventListenerRegistryService {
  constructor(private readonly eventBus: NotificationDeliveryEventBusService) {}

  register(handler: NotificationDeliveryEventHandler): () => void {
    return this.eventBus.subscribe(handler);
  }
}
