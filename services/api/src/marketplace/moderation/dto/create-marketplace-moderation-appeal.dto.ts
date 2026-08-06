import { IsString, MaxLength } from 'class-validator';

export class CreateMarketplaceModerationAppealDto {
  @IsString()
  @MaxLength(5_000)
  grounds!: string;

  @IsString()
  @MaxLength(5_000)
  requestedOutcome!: string;
}
