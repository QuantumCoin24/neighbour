import { IsEnum, IsString, MaxLength } from 'class-validator';

export enum MarketplaceModerationAppealDecisionDto {
  UPHELD = 'UPHELD',
  PARTIALLY_UPHELD = 'PARTIALLY_UPHELD',
  OVERTURNED = 'OVERTURNED',
  DISMISSED = 'DISMISSED',
}

export class ResolveMarketplaceModerationAppealDto {
  @IsEnum(MarketplaceModerationAppealDecisionDto)
  decision!: MarketplaceModerationAppealDecisionDto;

  @IsString()
  @MaxLength(5_000)
  reasons!: string;
}
