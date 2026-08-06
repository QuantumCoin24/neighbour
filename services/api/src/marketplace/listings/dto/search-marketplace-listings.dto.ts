import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import {
  MarketplaceListingCategory,
  MarketplaceListingCondition,
} from '../../../generated/prisma/client';

export class SearchMarketplaceListingsDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(120)
  query?: string;

  @IsOptional()
  @IsEnum(MarketplaceListingCategory)
  category?: MarketplaceListingCategory;

  @IsOptional()
  @IsEnum(MarketplaceListingCondition)
  condition?: MarketplaceListingCondition;

  @IsOptional()
  @IsUUID()
  communityId?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  minPricePence?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  maxPricePence?: number;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  freeOnly?: boolean;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 24;

  @IsOptional()
  @IsUUID()
  cursor?: string;
}
