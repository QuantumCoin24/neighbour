import { Injectable } from '@nestjs/common';

import type { RankingEntity } from './ranking.entity';

@Injectable()
export class RankingService {
  rank(items: RankingEntity[]): RankingEntity[] {
    return [...items].sort(
      (a, b) => b.relevanceScore + b.trustScore - (a.relevanceScore + a.trustScore),
    );
  }
}
