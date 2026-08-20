import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../../database/database.module';
import { SubscriptionModule } from '../../../payments/subscription/subscription.module';

import { OfferController } from './offer.controller';
import { OfferService } from './offer.service';

import { OfferRepository } from './offer.repository';
import { PrismaOfferRepository } from './prisma-offer.repository';

@Module({
  imports: [DatabaseModule, SubscriptionModule],

  controllers: [OfferController],

  providers: [
    OfferService,

    {
      provide: OfferRepository,
      useClass: PrismaOfferRepository,
    },
  ],

  exports: [OfferService],
})
export class OfferModule {}
