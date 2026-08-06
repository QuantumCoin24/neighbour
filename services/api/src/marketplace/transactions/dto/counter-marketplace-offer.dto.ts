import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CounterMarketplaceOfferDto {
  @IsInt()
  @Min(1)
  @Max(2_147_483_647)
  amountPence!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1_000)
  message?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  expiresInDays?: number;
}
