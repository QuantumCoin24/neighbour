import { Body, Controller, Get, Post } from '@nestjs/common';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';

import { CreateReportDto } from './dto/create-report.dto';
import type { ReportResponse } from './interfaces/report-response.interface';
import { ReportService } from './report.service';

@Controller('security/reports')
export class ReportController {

  constructor(
    private readonly service: ReportService,
  ) {}

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateReportDto,
  ): Promise<ReportResponse> {
    return this.service.create(user.id, dto);
  }


  @Get('mine')
  findMine(
    @CurrentUser() user: AuthUser,
  ): Promise<ReportResponse[]> {
    return this.service.findMine(user.id);
  }

}
