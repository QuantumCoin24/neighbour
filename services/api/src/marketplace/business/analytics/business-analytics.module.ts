import { Module } from '@nestjs/common';

import { AnalyticsModule } from '../../../analytics/analytics.module';
import { DatabaseModule } from '../../../database/database.module';
import { SubscriptionModule } from '../../../payments/subscription/subscription.module';

import { BusinessAnalyticsService } from './business-analytics.service';
import { BusinessAnalyticsController } from './business-analytics.controller';

@Module({
  controllers: [BusinessAnalyticsController],

  imports: [AnalyticsModule, DatabaseModule, SubscriptionModule],

  providers: [BusinessAnalyticsService],

  exports: [BusinessAnalyticsService],
})
export class BusinessAnalyticsModule {}
