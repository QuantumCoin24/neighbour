import { Module } from '@nestjs/common';

import { AnalyticsService } from './analytics.service';
import { AnalyticsIntelligenceService } from './intelligence/analytics-intelligence.service';
import { EngagementAnalyticsService } from './intelligence/engagement-analytics.service';

@Module({
  providers: [AnalyticsService, AnalyticsIntelligenceService, EngagementAnalyticsService],

  exports: [AnalyticsService, AnalyticsIntelligenceService, EngagementAnalyticsService],
})
export class AnalyticsModule {}
