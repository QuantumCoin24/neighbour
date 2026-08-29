import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
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
  MinLength,
  ValidateNested,
} from 'class-validator';
import { LocationVisibility, TrailCategory } from '../../generated/prisma/client.js';

export class UpdateTrailCheckpointDto {
  @IsOptional()
  @IsUUID()
  mapDiscoveryId?: string;

  @IsInt()
  @Min(0)
  position!: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  instruction?: string;

  @IsLatitude()
  latitude!: number;

  @IsLongitude()
  longitude!: number;
}

export class UpdateTrailDto {
  @IsOptional()
  @IsEnum(TrailCategory)
  category?: TrailCategory;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(LocationVisibility)
  visibility?: LocationVisibility;

  @IsOptional()
  @IsInt()
  @Min(0)
  distanceM?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10080)
  estimatedMinutes?: number;

  @IsOptional()
  @IsString()
  startsAt?: string;

  @IsOptional()
  @IsString()
  expiresAt?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => UpdateTrailCheckpointDto)
  checkpoints?: UpdateTrailCheckpointDto[];
}
