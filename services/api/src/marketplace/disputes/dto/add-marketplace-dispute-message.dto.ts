import { IsString, MaxLength } from 'class-validator';

export class AddMarketplaceDisputeMessageDto {
  @IsString()
  @MaxLength(5_000)
  message!: string;
}
