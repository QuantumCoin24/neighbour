import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export enum MarketplaceFraudSignalTypeDto {
  PAYMENT_PATTERN = 'PAYMENT_PATTERN',
  ACCOUNT_PATTERN = 'ACCOUNT_PATTERN',
  LISTING_PATTERN = 'LISTING_PATTERN',
  MESSAGE_PATTERN = 'MESSAGE_PATTERN',
  DEVICE_PATTERN = 'DEVICE_PATTERN',
  IDENTITY_PATTERN = 'IDENTITY_PATTERN',
  DISPUTE_PATTERN = 'DISPUTE_PATTERN',
  REVIEW_PATTERN = 'REVIEW_PATTERN',
  VELOCITY_PATTERN = 'VELOCITY_PATTERN',
  MANUAL_REPORT = 'MANUAL_REPORT',
}

export class AddMarketplaceFraudSignalDto {
  @IsEnum(MarketplaceFraudSignalTypeDto)
  type!: MarketplaceFraudSignalTypeDto;

  @IsUUID('4')
  subjectId!: string;

  @IsInt()
  @Min(1)
  @Max(1_000)
  weight!: number;

  @IsString()
  @MaxLength(2_000)
  description!: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
