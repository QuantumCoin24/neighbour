import { Module } from '@nestjs/common';

import { MarketplaceReputationController } from './controllers/marketplace-reputation.controller';
import { MarketplaceReputationScoreService } from './scoring/marketplace-reputation-score.service';
import { MarketplaceReputationService } from './services/marketplace-reputation.service';

@Module({
  controllers: [MarketplaceReputationController],
  providers: [MarketplaceReputationScoreService, MarketplaceReputationService],
  exports: [MarketplaceReputationScoreService, MarketplaceReputationService],
})
export class MarketplaceReputationModule {}
