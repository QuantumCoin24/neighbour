import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export enum MarketplaceDisputeResolutionDto {
  NO_ACTION = 'NO_ACTION',
  BUYER_REFUND = 'BUYER_REFUND',
  PARTIAL_REFUND = 'PARTIAL_REFUND',
  SELLER_PAYMENT_RELEASE = 'SELLER_PAYMENT_RELEASE',
  RETURN_ITEM = 'RETURN_ITEM',
  REPLACEMENT = 'REPLACEMENT',
  MUTUAL_AGREEMENT = 'MUTUAL_AGREEMENT',
  ACCOUNT_RESTRICTION = 'ACCOUNT_RESTRICTION',
}

export class ResolveMarketplaceDisputeDto {
  @IsEnum(MarketplaceDisputeResolutionDto)
  resolution!: MarketplaceDisputeResolutionDto;

  @IsOptional()
  @IsInt()
  @Min(1)
  refundAmountPence?: number;

  @IsString()
  @MaxLength(5_000)
  decision!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  instructions?: string;
}
