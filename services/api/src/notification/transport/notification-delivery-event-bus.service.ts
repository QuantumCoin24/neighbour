import { Injectable } from '@nestjs/common';

import type { NotificationDeliveryAuditEvent } from './notification-delivery-audit-mapper.service';

export type NotificationDeliveryEventHandler = (event: NotificationDeliveryAuditEvent) => void;

@Injectable()
export class NotificationDeliveryEventBusService {
  private readonly handlers = new Set<NotificationDeliveryEventHandler>();

  subscribe(handler: NotificationDeliveryEventHandler): () => void {
    this.handlers.add(handler);

    return () => {
      this.handlers.delete(handler);
    };
  }

  publish(event: NotificationDeliveryAuditEvent): void {
    for (const handler of this.handlers) {
      handler(event);
    }
  }

  subscriberCount(): number {
    return this.handlers.size;
  }
}
