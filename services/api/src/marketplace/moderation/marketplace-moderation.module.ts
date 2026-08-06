import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { MarketplaceModerationController } from './controllers/marketplace-moderation.controller';
import { MarketplaceModerationPolicyService } from './policy/marketplace-moderation-policy.service';
import { MarketplaceModerationRiskScoreService } from './scoring/marketplace-moderation-risk-score.service';
import { MarketplaceModerationService } from './services/marketplace-moderation.service';
import { MarketplaceModerationStateMachineService } from './state-machine/marketplace-moderation-state-machine.service';

@Module({
  imports: [DatabaseModule],
  controllers: [MarketplaceModerationController],
  providers: [
    MarketplaceModerationPolicyService,
    MarketplaceModerationRiskScoreService,
    MarketplaceModerationStateMachineService,
    MarketplaceModerationService,
  ],
  exports: [
    MarketplaceModerationPolicyService,
    MarketplaceModerationRiskScoreService,
    MarketplaceModerationStateMachineService,
    MarketplaceModerationService,
  ],
})
export class MarketplaceModerationModule {}
