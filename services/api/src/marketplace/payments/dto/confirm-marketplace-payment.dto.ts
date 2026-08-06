import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ConfirmMarketplacePaymentDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  providerReference?: string;
}
