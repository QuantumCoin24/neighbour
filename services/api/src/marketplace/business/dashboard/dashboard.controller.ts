import { Controller, Get, Param } from '@nestjs/common';

import { BusinessDashboardService } from './dashboard.service';

@Controller('businesses')
export class BusinessDashboardController {
  constructor(private readonly service: BusinessDashboardService) {}

  @Get(':businessId/dashboard')
  getDashboard(
    @Param('businessId')
    businessId: string,
  ) {
    return this.service.getDashboard(businessId);
  }
}
