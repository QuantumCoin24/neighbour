import { IsOptional, IsString, MaxLength } from 'class-validator';

export class EscalateMarketplaceDisputeDto {
  @IsString()
  @MaxLength(2_000)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  additionalContext?: string;
}
