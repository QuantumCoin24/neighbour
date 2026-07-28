import { IsIn, IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';

export const postStatuses = ['DRAFT', 'PUBLISHED'] as const;
export const postVisibilities = ['PUBLIC', 'CONNECTIONS', 'COMMUNITY', 'PRIVATE'] as const;

export type PostStatusValue = (typeof postStatuses)[number];
export type PostVisibilityValue = (typeof postVisibilities)[number];

export class CreatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsString()
  @Length(1, 10000)
  content!: string;

  @IsOptional()
  @IsUUID()
  communityId?: string;

  @IsOptional()
  @IsIn(postStatuses)
  status?: PostStatusValue;

  @IsOptional()
  @IsIn(postVisibilities)
  visibility?: PostVisibilityValue;
}
