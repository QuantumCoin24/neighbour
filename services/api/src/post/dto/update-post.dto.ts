import { IsIn, IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';

import {
  postStatuses,
  postVisibilities,
  type PostStatusValue,
  type PostVisibilityValue,
} from './create-post.dto';

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string | null;

  @IsOptional()
  @IsString()
  @Length(1, 10000)
  content?: string;

  @IsOptional()
  @IsUUID()
  communityId?: string | null;

  @IsOptional()
  @IsIn(postStatuses)
  status?: PostStatusValue;

  @IsOptional()
  @IsIn(postVisibilities)
  visibility?: PostVisibilityValue;
}
