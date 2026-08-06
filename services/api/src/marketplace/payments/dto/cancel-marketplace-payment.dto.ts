import { IsString, MaxLength } from 'class-validator';

export class CancelMarketplacePaymentDto {
  @IsString()
  @MaxLength(1_000)
  reason!: string;
}
