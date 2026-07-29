import { Injectable } from '@nestjs/common';

import type { NotificationDeliveryAuditEvent } from './notification-delivery-audit-mapper.service';

@Injectable()
export class NotificationDeliveryEventPublisherService {
  private readonly events: NotificationDeliveryAuditEvent[] = [];

  publish(event: NotificationDeliveryAuditEvent): void {
    this.events.push(event);
  }

  getPublishedEvents(): readonly NotificationDeliveryAuditEvent[] {
    return this.events;
  }

  clear(): void {
    this.events.length = 0;
  }
}
