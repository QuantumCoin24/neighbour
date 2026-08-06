import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export const NEARBY_RESULT_TYPES = [
  'COMMUNITY',
  'BUSINESS',
  'EVENT',
  'MARKETPLACE_LISTING',
] as const;

export type NearbyResultType = (typeof NEARBY_RESULT_TYPES)[number];

export const NEARBY_SORT_OPTIONS = ['RELEVANCE', 'DISTANCE', 'NEWEST'] as const;

export type NearbySortOption = (typeof NEARBY_SORT_OPTIONS)[number];

export class NearbyQueryDto {
  @Type(() => Number)
  @IsNumber()
  @IsLatitude()
  latitude!: number;

  @Type(() => Number)
  @IsNumber()
  @IsLongitude()
  longitude!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(100)
  radiusKm: number = 8;

  @IsOptional()
  @IsIn(NEARBY_RESULT_TYPES, {
    each: true,
  })
  types?: NearbyResultType[];

  @IsOptional()
  @IsIn(NEARBY_SORT_OPTIONS)
  sort: NearbySortOption = 'RELEVANCE';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 40;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  verifiedOnly?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  eventsOnlyUpcoming?: boolean;
}
