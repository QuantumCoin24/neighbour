import { Controller, Get } from '@nestjs/common';

import { MarketplaceReputationService } from '../services/marketplace-reputation.service';

@Controller('marketplace/reputation')
export class MarketplaceReputationController {
  constructor(private readonly reputation: MarketplaceReputationService) {}

  @Get('health')
  getHealth() {
    return this.reputation.getHealth();
  }

  @Get('review-rules')
  getReviewRules() {
    return this.reputation.getReviewRules();
  }
}
