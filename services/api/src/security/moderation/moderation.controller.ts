import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';

import { Roles } from '../../auth/decorators/roles.decorator';

import { RolesGuard } from '../../auth/guards/roles.guard';

import { PlatformRole } from '../../generated/prisma/client.js';

import type { AuthUser } from '../../auth/interfaces/auth-user.interface';

import { ModerationService } from './moderation.service';

import { ModerationStatsService } from './moderation.stats';

import { UpdateReportStatusDto } from './dto/update-report-status.dto';

@Controller('security/moderation')
@UseGuards(RolesGuard)
export class ModerationController {
  constructor(
    private readonly service: ModerationService,
    private readonly stats: ModerationStatsService,
  ) {}

  @Get('stats')
  @Roles(PlatformRole.MODERATOR, PlatformRole.ADMIN, PlatformRole.SUPER_ADMIN)
  getStats() {
    return this.stats.overview();
  }

  @Get('reports')
  @Roles(PlatformRole.MODERATOR, PlatformRole.ADMIN, PlatformRole.SUPER_ADMIN)
  findReports(
    @Query('status')
    status?: string,

    @Query('targetType')
    targetType?: string,

    @Query('search')
    search?: string,
  ) {
    return this.service.findReports({
      ...(status ? { status } : {}),

      ...(targetType ? { targetType } : {}),

      ...(search ? { search } : {}),
    });
  }

  @Get('reports/:id')
  findReport(@Param('id') id: string) {
    return this.service.findReport(id);
  }

  @Patch('reports/:id')
  @Roles(PlatformRole.MODERATOR, PlatformRole.ADMIN, PlatformRole.SUPER_ADMIN)
  updateStatus(
    @CurrentUser()
    user: AuthUser,

    @Param('id')
    id: string,

    @Body()
    dto: UpdateReportStatusDto,
  ) {
    return this.service.updateStatus(id, user.id, dto);
  }
}
