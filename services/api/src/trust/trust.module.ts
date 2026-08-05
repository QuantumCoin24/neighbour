import { Module } from '@nestjs/common';

import { TrustProfileService } from './trust-profile.service';
import { TrustController } from './trust.controller';

import { ReputationService } from './reputation/reputation.service';
import { VerificationService } from './verification/verification.service';

import { TrustIntelligenceService } from './trust-intelligence.service';

@Module({
  controllers: [TrustController],
  providers: [
    TrustProfileService,

    ReputationService,

    VerificationService,

    TrustIntelligenceService,
  ],

  exports: [TrustProfileService, TrustIntelligenceService],
})
export class TrustModule {}
