import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { SubscriptionModule } from '../payments/subscription/subscription.module';
import { MediaAssetService } from './assets/media-asset.service';
import { MediaEventBusService } from './events/media-event-bus.service';
import { MediaController } from './media.controller';
import { MediaProcessingService } from './processing/media-processing.service';
import { ObjectStorageService } from './storage/object-storage.service';

@Module({
  imports: [DatabaseModule, SubscriptionModule],
  controllers: [MediaController],
  providers: [
    MediaAssetService,
    ObjectStorageService,
    MediaProcessingService,
    MediaEventBusService,
  ],
  exports: [MediaAssetService, ObjectStorageService],
})
export class MediaModule {}
