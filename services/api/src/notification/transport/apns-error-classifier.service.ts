import { Injectable } from '@nestjs/common';

export type ApnsErrorClassification = 'success' | 'permanent' | 'temporary' | 'unknown';

@Injectable()
export class ApnsErrorClassifierService {
  classify(status: number, reason?: string): ApnsErrorClassification {
    if (status == 200) {
      return 'success';
    }

    switch (reason) {
      case 'BadDeviceToken':
      case 'DeviceTokenNotForTopic':
      case 'Unregistered':
      case 'PayloadTooLarge':
        return 'permanent';

      case 'TooManyRequests':
      case 'InternalServerError':
      case 'ServiceUnavailable':
      case 'Shutdown':
        return 'temporary';

      default:
        return 'unknown';
    }
  }
}
