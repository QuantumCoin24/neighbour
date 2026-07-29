import { Injectable } from '@nestjs/common';

import type { RecommendationEntity } from './recommendation.entity';

@Injectable()
export class RecommendationService {
  private recommendations: RecommendationEntity[] = [];

  create(recommendation: RecommendationEntity): RecommendationEntity {
    this.recommendations.push(recommendation);

    return recommendation;
  }

  listForBusiness(businessId: string): RecommendationEntity[] {
    return this.recommendations.filter((item) => item.businessId === businessId);
  }
}
