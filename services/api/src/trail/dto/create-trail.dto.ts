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
import { LocationVisibility, TrailCategory, TrailScope } from '../../generated/prisma/client.js';

export class CreateTrailCheckpointDto {
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

export class CreateTrailDto {
  @IsEnum(TrailScope)
  scope!: TrailScope;

  @IsOptional()
  @IsUUID()
  communityId?: string;

  @IsEnum(TrailCategory)
  category!: TrailCategory;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  description!: string;

  @IsEnum(LocationVisibility)
  visibility!: LocationVisibility;

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

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => CreateTrailCheckpointDto)
  checkpoints!: CreateTrailCheckpointDto[];
}
