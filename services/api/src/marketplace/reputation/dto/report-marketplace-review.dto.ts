import { IsString, MaxLength } from 'class-validator';

export class ReportMarketplaceReviewDto {
  @IsString()
  @MaxLength(120)
  reason!: string;

  @IsString()
  @MaxLength(2_000)
  description!: string;
}
