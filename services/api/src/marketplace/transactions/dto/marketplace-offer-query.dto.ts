import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

import { MarketplaceOfferStatus } from '../../../generated/prisma/client';

export class MarketplaceOfferQueryDto {
  @IsOptional()
  @IsEnum(MarketplaceOfferStatus)
  status?: MarketplaceOfferStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 50;
}
