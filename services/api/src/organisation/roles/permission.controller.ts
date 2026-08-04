import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { OrganisationPermissionService } from './permission.service';

@Controller('roles')
export class OrganisationPermissionController {
  constructor(private readonly service: OrganisationPermissionService) {}

  @Post(':roleId/permissions')
  create(
    @Param('roleId')
    roleId: string,

    @Body()
    body: {
      name: string;
    },
  ) {
    return this.service.create({
      roleId,

      name: body.name,
    });
  }

  @Get(':roleId/permissions')
  list(
    @Param('roleId')
    roleId: string,
  ) {
    return this.service.findByRole(roleId);
  }
}
