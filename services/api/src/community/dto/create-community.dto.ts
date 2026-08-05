import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPostalCode,
  IsString,
  IsUrl,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import {
  CommunityCategory,
  CommunityJoinPolicy,
  CommunityVisibility,
  LocationVisibility,
} from '../../generated/prisma/client.js';

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function normaliseHandle(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim().replace(/^@+/, '').toLowerCase();
}

function normaliseTags(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return value;
  }

  return [
    ...new Set(
      value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean),
    ),
  ].slice(0, 12);
}

function normaliseRules(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return value;
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export class CreateCommunityDto {
  @Transform(({ value }) => trimString(value))
  @IsString()
  @Length(3, 100)
  name!: string;

  @Transform(({ value }) => normaliseHandle(value))
  @IsOptional()
  @IsString()
  @Length(3, 40)
  @Matches(/^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/, {
    message: 'Handle may contain lowercase letters, numbers, dots, underscores and hyphens.',
  })
  handle?: string;

  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @MaxLength(160)
  shortDescription?: string;

  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  description?: string;

  @IsOptional()
  @IsEnum(CommunityCategory)
  category: CommunityCategory = CommunityCategory.LOCAL_AREA;

  @Transform(({ value }) => normaliseTags(value))
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags: string[] = [];

  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @MaxLength(500)
  welcomeMessage?: string;

  @Transform(({ value }) => normaliseRules(value))
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  rules: string[] = [];

  @IsOptional()
  @IsEnum(CommunityVisibility)
  visibility: CommunityVisibility = CommunityVisibility.PUBLIC;

  @IsOptional()
  @IsEnum(CommunityJoinPolicy)
  joinPolicy: CommunityJoinPolicy = CommunityJoinPolicy.OPEN;

  @IsOptional()
  @IsBoolean()
  approvalRequired = false;

  @IsOptional()
  @IsBoolean()
  allowMemberPosts = true;

  @IsOptional()
  @IsBoolean()
  allowBusinesses = true;

  @IsOptional()
  @IsBoolean()
  allowMarketplace = true;

  @IsOptional()
  @IsBoolean()
  allowEvents = true;

  @IsOptional()
  @IsBoolean()
  discoverable = true;

  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  addressLine1?: string;

  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  addressLine2?: string;

  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsOptional()
  @IsPostalCode('GB')
  postcode?: string;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100000)
  locationAccuracyM?: number;

  @IsOptional()
  @IsEnum(LocationVisibility)
  locationVisibility: LocationVisibility = LocationVisibility.PUBLIC;

  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsUrl({
    protocols: ['https'],
    require_protocol: true,
  })
  logoUrl?: string;

  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsUrl({
    protocols: ['https'],
    require_protocol: true,
  })
  bannerUrl?: string;

  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  accentColour?: string;
}
