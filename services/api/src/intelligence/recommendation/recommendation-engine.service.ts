import { Injectable } from '@nestjs/common';

import { RecommendationService } from './recommendation.service';
import type { RecommendationEntity } from './recommendation.entity';

@Injectable()
export class RecommendationEngineService {
  constructor(private readonly recommendations: RecommendationService) {}

  generate(
    userId: string,
    type: RecommendationEntity['targetType'],
    targetId: string,
    score: number,
  ) {
    return this.recommendations.create({
      id: crypto.randomUUID(),

      userId,

      targetType: type,

      targetId,

      score,

      createdAt: new Date(),
    });
  }

  getRecommendations(userId: string) {
    return this.recommendations.rank(this.recommendations.findForUser(userId));
  }
}
