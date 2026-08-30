import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { RealtimeModule } from '../realtime/realtime.module';

import { DeviceController } from './device/device.controller';
import { DeviceRegistryService } from './device/device-registry.service';
import { NotificationDeliveryRouterService } from './delivery/notification-delivery-router.service';
import { NotificationRealtimePublisher } from './events/notification-realtime.publisher';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

import { NotificationIntelligenceService } from './intelligence/notification-intelligence.service';

import { ApnsClientService } from './push/apns-client.service';
import { ApnsConfigService } from './push/apns-config.service';
import { ApnsTokenService } from './push/apns-token.service';
import { PushNotificationService } from './push/push-notification.service';

@Module({
  imports: [DatabaseModule, RealtimeModule],
  controllers: [NotificationController, DeviceController],
  providers: [
    NotificationService,
    NotificationRealtimePublisher,
    NotificationIntelligenceService,
    DeviceRegistryService,
    ApnsConfigService,
    ApnsTokenService,
    ApnsClientService,
    PushNotificationService,
    NotificationDeliveryRouterService,
  ],
  exports: [
    NotificationService,
    NotificationRealtimePublisher,
    NotificationIntelligenceService,
    DeviceRegistryService,
    PushNotificationService,
    NotificationDeliveryRouterService,
  ],
})
export class NotificationModule {}
