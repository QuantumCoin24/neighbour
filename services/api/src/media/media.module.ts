import { Module } from '@nestjs/common';

import { MediaAssetService } from './assets/media-asset.service';
import { StorageService } from './storage/storage.service';
import { MediaProcessingService } from './processing/media-processing.service';
import { MediaEventBusService } from './events/media-event-bus.service';
import { MediaController } from './media.controller';

@Module({
  controllers: [MediaController],

  providers: [MediaAssetService, StorageService, MediaProcessingService, MediaEventBusService],

  exports: [MediaAssetService, StorageService],
})
export class MediaModule {}
