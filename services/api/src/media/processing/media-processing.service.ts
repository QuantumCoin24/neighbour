import { Injectable } from '@nestjs/common';

@Injectable()
export class MediaProcessingService {
  process(assetId: string) {
    return {
      assetId,
      status: 'processed',
      processedAt: new Date(),
    };
  }
}
