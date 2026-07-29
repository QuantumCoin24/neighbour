import { Injectable } from '@nestjs/common';

import type { RecommendationEntity } from './recommendation.entity';

@Injectable()
export class RecommendationService {
  private recommendations: RecommendationEntity[] = [];

  create(recommendation: RecommendationEntity): RecommendationEntity {
    this.recommendations.push(recommendation);

    return recommendation;
  }

  findForUser(userId: string): RecommendationEntity[] {
    return this.recommendations.filter((item) => item.userId === userId);
  }

  rank(items: RecommendationEntity[]): RecommendationEntity[] {
    return [...items].sort((a, b) => b.score - a.score);
  }
}
