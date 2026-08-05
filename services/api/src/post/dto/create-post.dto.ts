import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';

export const postStatuses = ['DRAFT', 'PUBLISHED'] as const;

export const postVisibilities = ['PUBLIC', 'CONNECTIONS', 'COMMUNITY', 'PRIVATE'] as const;

export const postTypes = [
  'STANDARD',
  'ANNOUNCEMENT',
  'QUESTION',
  'RECOMMENDATION',
  'HELP_REQUEST',
  'LOST_FOUND',
  'SAFETY_ALERT',
  'ROAD_CLOSURE',
  'LOCAL_UPDATE',
  'POLL',
  'EVENT_SHARE',
  'MARKETPLACE_SHARE',
  'BUSINESS_UPDATE',
  'VOLUNTEER_REQUEST',
] as const;

export type PostStatusValue = (typeof postStatuses)[number];

export type PostVisibilityValue = (typeof postVisibilities)[number];

export type PostTypeValue = (typeof postTypes)[number];

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class CreatePostDto {
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @Transform(({ value }) => trimString(value))
  @IsString()
  @Length(1, 10000)
  content!: string;

  @IsOptional()
  @IsIn(postTypes)
  type: PostTypeValue = 'STANDARD';

  @IsOptional()
  @IsUUID()
  communityId?: string;

  @IsOptional()
  @IsUUID()
  neighbourhoodId?: string;

  @IsOptional()
  @IsIn(postStatuses)
  status: PostStatusValue = 'PUBLISHED';

  @IsOptional()
  @IsIn(postVisibilities)
  visibility?: PostVisibilityValue;

  @IsOptional()
  @IsBoolean()
  isPinned = false;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
