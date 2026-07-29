import { Injectable } from '@nestjs/common';

import type { NotificationDeliveryAuditEvent } from './notification-delivery-audit-mapper.service';
import { NotificationDeliveryEventBusService } from './notification-delivery-event-bus.service';

@Injectable()
export class NotificationDeliveryEventDispatcherService {
  constructor(private readonly eventBus: NotificationDeliveryEventBusService) {}

  dispatch(event: NotificationDeliveryAuditEvent): void {
    this.eventBus.publish(event);
  }
}
