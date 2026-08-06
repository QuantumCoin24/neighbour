import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import {
  MarketplaceListingCategory,
  MarketplaceListingCondition,
  MarketplaceListingStatus,
} from '../../../generated/prisma/client';

export class CreateMarketplaceListingDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description!: string;

  @IsEnum(MarketplaceListingCategory)
  category!: MarketplaceListingCategory;

  @IsEnum(MarketplaceListingCondition)
  condition!: MarketplaceListingCondition;

  @IsOptional()
  @IsEnum(MarketplaceListingStatus)
  status?: MarketplaceListingStatus;

  @IsOptional()
  @IsUUID()
  communityId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100_000_000)
  pricePence?: number;

  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @IsOptional()
  @IsBoolean()
  acceptsOffers?: boolean;

  @IsOptional()
  @IsBoolean()
  collectionAvailable?: boolean;

  @IsOptional()
  @IsBoolean()
  deliveryAvailable?: boolean;

  @IsOptional()
  @IsBoolean()
  postageAvailable?: boolean;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  localArea?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @Matches(/^[A-Z]{1,2}\d[A-Z\d]?\s?$/)
  postcodeDistrict?: string;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(9)
  @IsUUID('4', {
    each: true,
  })
  mediaIds?: string[];
}
