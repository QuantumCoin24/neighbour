import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CloseMarketplaceDisputeDto {
  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  note?: string;
}
