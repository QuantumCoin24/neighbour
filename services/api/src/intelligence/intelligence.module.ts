import { Module } from '@nestjs/common';

import { IntelligenceService } from './intelligence.service';

import { IntelligenceEventBusService } from './events/intelligence-event-bus.service';

import { DiscoveryService } from './discovery/discovery.service';

import { RecommendationService } from './recommendation/recommendation.service';
import { RecommendationEngineService } from './recommendation/recommendation-engine.service';

import { PreferenceService } from './personalisation/preference.service';

@Module({
  providers: [
    IntelligenceService,

    IntelligenceEventBusService,

    DiscoveryService,

    RecommendationService,
    RecommendationEngineService,

    PreferenceService,
  ],

  exports: [IntelligenceService],
})
export class IntelligenceModule {}
