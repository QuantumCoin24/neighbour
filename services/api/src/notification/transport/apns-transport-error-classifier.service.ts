import { Injectable } from '@nestjs/common';

export type ApnsErrorCategory = 'success' | 'retryable' | 'permanent';

export interface ApnsErrorClassification {
  category: ApnsErrorCategory;
  invalidateToken: boolean;
}

@Injectable()
export class ApnsTransportErrorClassifierService {
  classify(status: number): ApnsErrorClassification {
    if (status >= 200 && status < 300) {
      return {
        category: 'success',
        invalidateToken: false,
      };
    }

    if (status === 410 || status === 400) {
      return {
        category: 'permanent',
        invalidateToken: true,
      };
    }

    return {
      category: 'retryable',
      invalidateToken: false,
    };
  }
}
