import { IsEnum, IsOptional, IsString } from 'class-validator';

import { ReportStatus } from '../../../generated/prisma/client.js';

export class UpdateReportStatusDto {
  @IsEnum(ReportStatus)
  status: ReportStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
