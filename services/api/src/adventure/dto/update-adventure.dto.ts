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
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  AdventureCategory,
  AdventureStageType,
  LocationVisibility,
} from '../../generated/prisma/client.js';

export class UpdateAdventureStageDto {
  @IsInt()
  @Min(0)
  position!: number;

  @IsEnum(AdventureStageType)
  type!: AdventureStageType;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ValidateIf((stage) => stage.latitude !== undefined || stage.longitude !== undefined)
  @IsLongitude()
  longitude?: number;
}

export class UpdateAdventureDto {
  @IsOptional()
  @IsUUID()
  trailId?: string;

  @IsOptional()
  @IsEnum(AdventureCategory)
  category?: AdventureCategory;

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
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => UpdateAdventureStageDto)
  stages?: UpdateAdventureStageDto[];
}
