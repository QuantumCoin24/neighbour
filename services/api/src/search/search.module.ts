import { Module } from '@nestjs/common';

import { SubscriptionModule } from '../payments/subscription/subscription.module';

import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SearchIntelligenceService } from './intelligence/search-intelligence.service';

@Module({
  imports: [SubscriptionModule],

  controllers: [SearchController],

  providers: [SearchService, SearchIntelligenceService],

  exports: [SearchService],
})
export class SearchModule {}
