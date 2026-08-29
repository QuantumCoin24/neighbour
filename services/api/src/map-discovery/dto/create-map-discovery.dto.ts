import {
  IsDateString,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import {
  LocationVisibility,
  MapDiscoveryCategory,
  MapDiscoveryScope,
  MapDiscoveryType,
} from '../../generated/prisma/client.js';

export class CreateMapDiscoveryDto {
  @IsEnum(MapDiscoveryScope)
  scope!: MapDiscoveryScope;

  @IsEnum(MapDiscoveryType)
  type!: MapDiscoveryType;

  @IsOptional()
  @IsEnum(MapDiscoveryCategory)
  category?: MapDiscoveryCategory;

  @IsOptional()
  @IsUUID()
  communityId?: string;

  @IsString()
  @Length(3, 120)
  title!: string;

  @IsString()
  @MaxLength(3000)
  description!: string;

  @IsLatitude()
  latitude!: number;

  @IsLongitude()
  longitude!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  locationAccuracyM?: number;

  @IsOptional()
  @IsEnum(LocationVisibility)
  visibility?: LocationVisibility;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
