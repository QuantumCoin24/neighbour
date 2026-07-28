import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { NotificationRealtimePublisher } from './events/notification-realtime.publisher';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

@Module({
  imports: [DatabaseModule, RealtimeModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationRealtimePublisher],
  exports: [NotificationService],
})
export class NotificationModule {}
