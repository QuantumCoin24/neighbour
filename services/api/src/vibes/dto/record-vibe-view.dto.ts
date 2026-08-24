import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class RecordVibeViewDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  sessionKey?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(86400000)
  watchTimeMs!: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  completionRatio?: number;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsBoolean()
  replay?: boolean;
}
