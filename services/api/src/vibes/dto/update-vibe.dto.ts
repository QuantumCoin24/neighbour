import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import {
  VibeStatus,
  VibeVisibility,
} from '../../generated/prisma/client';

export class UpdateVibeDto {
  @IsOptional()
  @IsString()
  @MaxLength(2200)
  caption?: string;

  @IsOptional()
  @IsEnum(VibeStatus)
  status?: VibeStatus;

  @IsOptional()
  @IsEnum(VibeVisibility)
  visibility?: VibeVisibility;

  @IsOptional()
  @IsUUID()
  communityId?: string;

  @IsOptional()
  @IsUUID()
  neighbourhoodId?: string;

  @Type(() => Number)
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @Type(() => Number)
  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  locationAccuracyM?: number;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  postcode?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  mediaIds?: string[];
}
