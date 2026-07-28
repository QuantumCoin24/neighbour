import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { DeviceRegistryService } from './device/device-registry.service';
import { NotificationRealtimePublisher } from './events/notification-realtime.publisher';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { ApnsClientService } from './push/apns-client.service';
import { ApnsConfigService } from './push/apns-config.service';
import { ApnsTokenService } from './push/apns-token.service';
import { PushNotificationService } from './push/push-notification.service';
import { NotificationRetryQueueService } from './queue/notification-retry-queue.service';
import { NotificationDeliveryMetricsService } from './metrics/notification-delivery-metrics.service';
import { BadgeCounterService } from './badge/badge-counter.service';
import { NotificationRetrySchedulerService } from './scheduler/notification-retry-scheduler.service';
import { NotificationCollapseService } from './collapse/notification-collapse.service';
import { NotificationExpirationService } from './expiry/notification-expiration.service';
import { NotificationPriorityService } from './priority/notification-priority.service';
import { NotificationTopicService } from './topic/notification-topic.service';
import { ApnsHeaderBuilderService } from './headers/apns-header-builder.service';
import { ApnsRequestBuilderService } from './request/apns-request-builder.service';
import { ApnsHttpRequestFactoryService } from './client/apns-http-request-factory.service';
import { ApnsResponseParserService } from './response/apns-response-parser.service';
import { NotificationDeliveryLifecycleService } from './lifecycle/notification-delivery-lifecycle.service';

@Module({
  imports: [DatabaseModule, RealtimeModule],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationRealtimePublisher,
    DeviceRegistryService,
    ApnsConfigService,
    ApnsTokenService,
    ApnsClientService,
    PushNotificationService,
  ],
  exports: [NotificationService, DeviceRegistryService, PushNotificationService],
})
export class NotificationModule {}
