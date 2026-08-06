import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export enum MarketplaceDisputeReasonDto {
  ITEM_NOT_RECEIVED = 'ITEM_NOT_RECEIVED',
  ITEM_NOT_AS_DESCRIBED = 'ITEM_NOT_AS_DESCRIBED',
  DAMAGED_ITEM = 'DAMAGED_ITEM',
  PAYMENT_NOT_RECEIVED = 'PAYMENT_NOT_RECEIVED',
  COLLECTION_NO_SHOW = 'COLLECTION_NO_SHOW',
  DELIVERY_PROBLEM = 'DELIVERY_PROBLEM',
  UNAUTHORISED_PAYMENT = 'UNAUTHORISED_PAYMENT',
  REFUND_NOT_RECEIVED = 'REFUND_NOT_RECEIVED',
  SAFETY_CONCERN = 'SAFETY_CONCERN',
  OTHER = 'OTHER',
}

export class CreateMarketplaceDisputeDto {
  @IsUUID('4')
  transactionId!: string;

  @IsEnum(MarketplaceDisputeReasonDto)
  reason!: MarketplaceDisputeReasonDto;

  @IsString()
  @MaxLength(160)
  title!: string;

  @IsString()
  @MaxLength(5_000)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1_000)
  requestedResolution?: string;
}
