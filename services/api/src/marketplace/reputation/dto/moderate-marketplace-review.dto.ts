import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum MarketplaceReviewModerationDecisionDto {
  APPROVE = 'APPROVE',
  HIDE = 'HIDE',
  REMOVE = 'REMOVE',
}

export class ModerateMarketplaceReviewDto {
  @IsEnum(MarketplaceReviewModerationDecisionDto)
  decision!: MarketplaceReviewModerationDecisionDto;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  note?: string;
}
