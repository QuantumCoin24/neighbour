import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { OrganisationRoleService } from './role.service';

@Controller('organisations')
export class OrganisationRoleController {
  constructor(private readonly service: OrganisationRoleService) {}

  @Post(':organisationId/roles')
  create(
    @Param('organisationId')
    organisationId: string,

    @Body()
    body: {
      name: string;
    },
  ) {
    return this.service.create({
      organisationId,

      name: body.name,
    });
  }

  @Get(':organisationId/roles')
  list(
    @Param('organisationId')
    organisationId: string,
  ) {
    return this.service.findByOrganisation(organisationId);
  }
}
