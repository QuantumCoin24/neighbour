import { Controller, Get, Param } from '@nestjs/common';

import { OrganisationDashboardService } from './organisation-dashboard.service';

@Controller('organisations')
export class OrganisationDashboardController {
  constructor(private readonly service: OrganisationDashboardService) {}

  @Get(':organisationId/dashboard')
  get(
    @Param('organisationId')
    organisationId: string,
  ) {
    return this.service.getDashboard(organisationId);
  }
}
