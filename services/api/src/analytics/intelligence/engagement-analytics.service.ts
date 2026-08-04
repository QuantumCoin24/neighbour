import { Injectable } from '@nestjs/common';

import { AnalyticsIntelligenceService } from './analytics-intelligence.service';

@Injectable()
export class EngagementAnalyticsService {
  constructor(private readonly intelligence: AnalyticsIntelligenceService) {}

  analyse(input: { activities: number; notifications: number; interactions: number }) {
    const total = input.activities + input.notifications + input.interactions;

    return {
      activityScore: this.intelligence.healthScore(total),

      signals: {
        activities: input.activities,

        notifications: input.notifications,

        interactions: input.interactions,
      },
    };
  }
}
