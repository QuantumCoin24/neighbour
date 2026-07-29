import { Injectable, OnModuleInit } from '@nestjs/common';

import { NotificationDeliveryMetricsCollectorService } from './notification-delivery-metrics-collector.service';
import { NotificationDeliveryEventListenerRegistryService } from './notification-delivery-event-listener-registry.service';

@Injectable()
export class NotificationDeliveryMetricsListenerService implements OnModuleInit {
  constructor(
    private readonly registry: NotificationDeliveryEventListenerRegistryService,
    private readonly metrics: NotificationDeliveryMetricsCollectorService,
  ) {}

  onModuleInit(): void {
    this.registry.register((event) => {
      this.metrics.record(event);
    });
  }
}
