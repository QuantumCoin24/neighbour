import { IsEnum } from 'class-validator';

import { MarketplaceFulfilmentMethod } from '../../../generated/prisma/client';

export class CreateFulfilmentDto {
  @IsEnum(MarketplaceFulfilmentMethod)
  method!: MarketplaceFulfilmentMethod;
}
