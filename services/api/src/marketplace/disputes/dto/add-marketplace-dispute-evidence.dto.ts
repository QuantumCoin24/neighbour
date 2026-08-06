import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export enum MarketplaceDisputeEvidenceTypeDto {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  RECEIPT = 'RECEIPT',
  TRACKING = 'TRACKING',
  CONVERSATION = 'CONVERSATION',
  PAYMENT_RECORD = 'PAYMENT_RECORD',
  OTHER = 'OTHER',
}

export class AddMarketplaceDisputeEvidenceDto {
  @IsUUID('4')
  mediaId!: string;

  @IsEnum(MarketplaceDisputeEvidenceTypeDto)
  type!: MarketplaceDisputeEvidenceTypeDto;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  description?: string;
}
