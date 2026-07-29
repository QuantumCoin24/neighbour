import { Injectable } from '@nestjs/common';

import type { NotificationDeliveryAuditEvent } from './notification-delivery-audit-mapper.service';

@Injectable()
export class NotificationDeliveryEventSubscriberService {
  private readonly received: NotificationDeliveryAuditEvent[] = [];

  receive(event: NotificationDeliveryAuditEvent): void {
    this.received.push(event);
  }

  getReceivedEvents(): readonly NotificationDeliveryAuditEvent[] {
    return this.received;
  }

  clear(): void {
    this.received.length = 0;
  }
}
