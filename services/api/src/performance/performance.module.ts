import { Module } from '@nestjs/common';

import { CacheService } from './cache/cache.service';
import { QueryOptimisationService } from './query/query-optimisation.service';
import { PerformanceMetricsService } from './metrics/performance-metrics.service';
import { PerformanceIntelligenceService } from './intelligence/performance-intelligence.service';
import { PerformanceSignalService } from './signals/performance-signal.service';

@Module({
  providers: [
    CacheService,

    QueryOptimisationService,

    PerformanceMetricsService,

    PerformanceIntelligenceService,

    PerformanceSignalService,
  ],

  exports: [PerformanceIntelligenceService, PerformanceSignalService],
})
export class PerformanceModule {}
