import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export enum ReportTargetType {
  USER = 'USER',
  POST = 'POST',
  COMMENT = 'COMMENT',
  MESSAGE = 'MESSAGE',
  EVENT = 'EVENT',
}

export class CreateReportDto {

  @IsEnum(ReportTargetType)
  targetType: ReportTargetType;

  @IsUUID()
  targetId: string;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  description?: string;

}
