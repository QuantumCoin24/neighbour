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

import {
  postStatuses,
  postTypes,
  postVisibilities,
  type PostStatusValue,
  type PostTypeValue,
  type PostVisibilityValue,
} from './create-post.dto';

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class UpdatePostDto {
  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string | null;

  @Transform(({ value }) => trimString(value))
  @IsOptional()
  @IsString()
  @Length(1, 10000)
  content?: string;

  @IsOptional()
  @IsIn(postTypes)
  type?: PostTypeValue;

  @IsOptional()
  @IsUUID()
  communityId?: string | null;

  @IsOptional()
  @IsIn(postStatuses)
  status?: PostStatusValue;

  @IsOptional()
  @IsIn(postVisibilities)
  visibility?: PostVisibilityValue;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown> | null;
}
