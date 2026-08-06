import { IsInt, IsOptional, IsString, IsUUID, MaxLength, Min, Max } from 'class-validator';

export class CreateMarketplaceReviewDto {
  @IsUUID('4')
  transactionId!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  comment?: string;
}
