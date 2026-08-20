import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { SubscriptionModule } from '../../payments/subscription/subscription.module';
import { MarketplaceListingController } from './marketplace-listing.controller';
import { MarketplaceListingService } from './marketplace-listing.service';

@Module({
  imports: [DatabaseModule, SubscriptionModule],
  controllers: [MarketplaceListingController],
  providers: [MarketplaceListingService],
  exports: [MarketplaceListingService],
})
export class MarketplaceListingModule {}
