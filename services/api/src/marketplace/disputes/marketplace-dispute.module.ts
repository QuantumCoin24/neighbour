import { Module } from '@nestjs/common';

import { MarketplaceDisputeController } from './controllers/marketplace-dispute.controller';
import { MarketplaceDisputeService } from './services/marketplace-dispute.service';
import { MarketplaceDisputeStateMachineService } from './state-machine/marketplace-dispute-state-machine.service';

@Module({
  controllers: [MarketplaceDisputeController],
  providers: [MarketplaceDisputeStateMachineService, MarketplaceDisputeService],
  exports: [MarketplaceDisputeStateMachineService, MarketplaceDisputeService],
})
export class MarketplaceDisputeModule {}
