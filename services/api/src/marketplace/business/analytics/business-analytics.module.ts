import { Module } from '@nestjs/common';

import { AnalyticsModule } from '../../../analytics/analytics.module';

import { BusinessAnalyticsService } from './business-analytics.service';
import { BusinessAnalyticsController } from './business-analytics.controller';

@Module({
  controllers: [BusinessAnalyticsController],

  imports: [AnalyticsModule],

  providers: [BusinessAnalyticsService],

  exports: [BusinessAnalyticsService],
})
export class BusinessAnalyticsModule {}
