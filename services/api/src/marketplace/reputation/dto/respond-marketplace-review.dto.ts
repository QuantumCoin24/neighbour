import { IsString, MaxLength } from 'class-validator';

export class RespondMarketplaceReviewDto {
  @IsString()
  @MaxLength(1_000)
  response!: string;
}
