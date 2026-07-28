import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { DeviceRegistryService } from './device/device-registry.service';
import { NotificationRealtimePublisher } from './events/notification-realtime.publisher';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

@Module({
  imports: [DatabaseModule, RealtimeModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationRealtimePublisher, DeviceRegistryService],
  exports: [NotificationService, DeviceRegistryService],
})
export class NotificationModule {}
