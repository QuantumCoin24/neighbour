import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum MarketplaceModerationStatusDto {
  OPEN = 'OPEN',
  TRIAGED = 'TRIAGED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  AWAITING_INFORMATION = 'AWAITING_INFORMATION',
  ACTION_REQUIRED = 'ACTION_REQUIRED',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
  APPEALED = 'APPEALED',
  CLOSED = 'CLOSED',
}

export class UpdateMarketplaceModerationStatusDto {
  @IsEnum(MarketplaceModerationStatusDto)
  status!: MarketplaceModerationStatusDto;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  note?: string;
}
