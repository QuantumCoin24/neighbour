import { Injectable } from '@nestjs/common';

import type { ApnsErrorClassification } from './apns-error-classifier.service';

@Injectable()
export class ApnsRetryPolicyService {
  shouldRetry(classification: ApnsErrorClassification, attempt: number): boolean {
    if (attempt >= 3) {
      return false;
    }

    return classification === 'temporary';
  }

  nextDelayMilliseconds(attempt: number): number {
    return 1000 * 2 ** attempt;
  }
}
