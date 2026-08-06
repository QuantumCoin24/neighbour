import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export enum MarketplaceModerationActionTypeDto {
  NO_ACTION = 'NO_ACTION',
  WARNING = 'WARNING',
  CONTENT_HIDDEN = 'CONTENT_HIDDEN',
  CONTENT_REMOVED = 'CONTENT_REMOVED',
  LISTING_SUSPENDED = 'LISTING_SUSPENDED',
  LISTING_REMOVED = 'LISTING_REMOVED',
  MARKETPLACE_RESTRICTED = 'MARKETPLACE_RESTRICTED',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  ACCOUNT_TERMINATED = 'ACCOUNT_TERMINATED',
  PAYMENT_HOLD = 'PAYMENT_HOLD',
  REFUND_REQUIRED = 'REFUND_REQUIRED',
  IDENTITY_REVERIFICATION = 'IDENTITY_REVERIFICATION',
}

export class ApplyMarketplaceModerationActionDto {
  @IsEnum(MarketplaceModerationActionTypeDto)
  action!: MarketplaceModerationActionTypeDto;

  @IsString()
  @MaxLength(5_000)
  decision!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationHours?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  instructions?: string;
}
