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
  AdventureScope,
  AdventureStageType,
  LocationVisibility,
} from '../../generated/prisma/client.js';

export class CreateAdventureStageDto {
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

export class CreateAdventureDto {
  @IsEnum(AdventureScope)
  scope!: AdventureScope;

  @IsOptional()
  @IsUUID()
  communityId?: string;

  @IsOptional()
  @IsUUID()
  trailId?: string;

  @IsEnum(AdventureCategory)
  category!: AdventureCategory;

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
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => CreateAdventureStageDto)
  stages!: CreateAdventureStageDto[];
}
