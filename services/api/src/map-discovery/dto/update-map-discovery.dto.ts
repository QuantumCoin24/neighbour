import {
  IsDateString,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  LocationVisibility,
  MapDiscoveryCategory,
  MapDiscoveryType,
} from '../../generated/prisma/client.js';

export class UpdateMapDiscoveryDto {
  @IsOptional()
  @IsEnum(MapDiscoveryType)
  type?: MapDiscoveryType;

  @IsOptional()
  @IsEnum(MapDiscoveryCategory)
  category?: MapDiscoveryCategory;

  @IsOptional()
  @IsString()
  @Length(3, 120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  description?: string;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;

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
  startsAt?: string | null;

  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;
}
