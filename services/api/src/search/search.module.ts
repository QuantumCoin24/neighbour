import { Module } from '@nestjs/common';

import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SearchIntelligenceService } from './intelligence/search-intelligence.service';

@Module({
  controllers: [SearchController],

  providers: [SearchService, SearchIntelligenceService],

  exports: [SearchService],
})
export class SearchModule {}
