import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { OrganisationVerificationService } from './verification.service';

@Controller('organisations')
export class OrganisationVerificationController {
  constructor(private readonly service: OrganisationVerificationService) {}

  @Post(':organisationId/verification')
  submit(
    @Param('organisationId')
    organisationId: string,

    @Body()
    body: {
      notes?: string;
    },
  ) {
    return this.service.submit({
      organisationId,

      ...(body.notes !== undefined ? { notes: body.notes } : {}),
    });
  }

  @Get(':organisationId/verification')
  find(
    @Param('organisationId')
    organisationId: string,
  ) {
    return this.service.findByOrganisation(organisationId);
  }

  @Patch(':organisationId/verification/status')
  update(
    @Param('organisationId')
    organisationId: string,

    @Body()
    body: {
      status: string;
    },
  ) {
    return this.service.updateStatus(organisationId, body.status);
  }
}
