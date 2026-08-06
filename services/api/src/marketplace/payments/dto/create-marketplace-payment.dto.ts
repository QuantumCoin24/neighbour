import { IsEnum, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export enum MarketplacePaymentMethodDto {
  CASH_ON_COLLECTION = 'CASH_ON_COLLECTION',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CARD = 'CARD',
  APPLE_PAY = 'APPLE_PAY',
  QFN = 'QFN',
}

export class CreateMarketplacePaymentDto {
  @IsUUID('4')
  transactionId!: string;

  @IsEnum(MarketplacePaymentMethodDto)
  method!: MarketplacePaymentMethodDto;

  @IsInt()
  @Min(1)
  amountPence!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reference?: string;
}
