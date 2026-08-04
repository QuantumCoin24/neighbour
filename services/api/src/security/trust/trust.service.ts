import { Injectable } from '@nestjs/common';

import type { TrustScoreEntity } from './trust-score.entity';

@Injectable()
export class TrustService {
  calculate(userId: string, score: number): TrustScoreEntity {
    return {
      userId,
      score,
      updatedAt: new Date(),
    };
  }
}
