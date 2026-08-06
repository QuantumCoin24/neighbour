import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RespondMarketplaceDisputeDto {
  @IsString()
  @MaxLength(5_000)
  response!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1_000)
  proposedResolution?: string;
}
