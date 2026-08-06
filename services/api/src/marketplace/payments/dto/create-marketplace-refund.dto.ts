import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateMarketplaceRefundDto {
  @IsInt()
  @Min(1)
  amountPence!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1_000)
  reason?: string;
}
