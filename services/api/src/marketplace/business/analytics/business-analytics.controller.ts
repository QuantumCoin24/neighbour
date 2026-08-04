import { Controller, Get, Param } from '@nestjs/common';

import { BusinessAnalyticsService } from './business-analytics.service';

@Controller('businesses')
export class BusinessAnalyticsController {
  constructor(private readonly service: BusinessAnalyticsService) {}

  @Get(':businessId/analytics')
  getAnalytics(
    @Param('businessId')
    businessId: string,
  ) {
    return this.service.getAnalytics(businessId);
  }
}
