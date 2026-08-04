import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { RealtimeModule } from '../realtime/realtime.module';

import { DeviceRegistryService } from './device/device-registry.service';
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
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationRealtimePublisher,
    NotificationIntelligenceService,
    DeviceRegistryService,
    ApnsConfigService,
    ApnsTokenService,
    ApnsClientService,
    PushNotificationService,
  ],
  exports: [
    NotificationService,
    NotificationRealtimePublisher,
    NotificationIntelligenceService,
    DeviceRegistryService,
    PushNotificationService,
  ],
})
export class NotificationModule {}
