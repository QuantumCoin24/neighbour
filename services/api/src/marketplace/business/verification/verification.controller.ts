import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { Roles } from '../../../auth/decorators/roles.decorator';
import type { AuthUser } from '../../../auth/interfaces/auth-user.interface';
import { PlatformRole } from '../../../generated/prisma/client.js';

import { VerificationService } from './verification.service';

@Controller('businesses')
export class VerificationController {
  constructor(private readonly service: VerificationService) {}

  @Post(':businessId/verification')
  submit(
    @CurrentUser()
    user: AuthUser,

    @Param('businessId')
    businessId: string,

    @Body()
    body: {
      notes?: string;
    },
  ) {
    return this.service.submit(user.id, {
      businessId,
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
    });
  }

  @Roles(PlatformRole.MODERATOR, PlatformRole.ADMIN, PlatformRole.SUPER_ADMIN)
  @Get('verifications')
  list(@Query('status') status?: string) {
    return this.service.list(status);
  }

  @Get(':businessId/verification')
  find(
    @Param('businessId')
    businessId: string,
  ) {
    return this.service.findByBusiness(businessId);
  }

  @Roles(PlatformRole.MODERATOR, PlatformRole.ADMIN, PlatformRole.SUPER_ADMIN)
  @Patch(':businessId/verification')
  review(
    @CurrentUser()
    user: AuthUser,

    @Param('businessId')
    businessId: string,

    @Body()
    body: {
      status: 'APPROVED' | 'REJECTED';
      notes?: string;
    },
  ) {
    return this.service.review(user.id, businessId, body);
  }
}
