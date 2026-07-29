import { Injectable } from '@nestjs/common';


@Injectable()
export class AnalyticsIntelligenceService {

  healthScore(
    activityCount: number,
  ): number {

    return Math.min(
      activityCount,
      100,
    );
  }

}
