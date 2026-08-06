import { IsEnum } from 'class-validator';

import { MarketplaceTransactionStatus } from '../../../generated/prisma/client';

export class UpdateMarketplaceTransactionStatusDto {
  @IsEnum(MarketplaceTransactionStatus)
  status!: MarketplaceTransactionStatus;
}
