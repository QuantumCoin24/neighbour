import { Controller, Get, Param } from '@nestjs/common';

import type { MarketplaceDisputeStatus } from '../interfaces/marketplace-dispute-response.interface';
import { MarketplaceDisputeService } from '../services/marketplace-dispute.service';

@Controller('marketplace/disputes')
export class MarketplaceDisputeController {
  constructor(private readonly disputes: MarketplaceDisputeService) {}

  @Get('health')
  getHealth() {
    return this.disputes.getHealth();
  }

  @Get('rules')
  getRules() {
    return this.disputes.getRules();
  }

  @Get('transitions/:status')
  getTransitions(
    @Param('status')
    status: MarketplaceDisputeStatus,
  ) {
    return this.disputes.getAllowedTransitions(status);
  }
}
