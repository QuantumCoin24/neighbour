import { Injectable } from '@nestjs/common';

import { CacheService } from '../cache/cache.service';
import { PerformanceMetricsService } from '../metrics/performance-metrics.service';
import { QueryOptimisationService } from '../query/query-optimisation.service';

@Injectable()
export class PerformanceIntelligenceService {
  constructor(
    private readonly cache: CacheService,

    private readonly metrics: PerformanceMetricsService,

    private readonly query: QueryOptimisationService,
  ) {}

  analyse(operation: string) {
    const metric = this.metrics.record(operation, 1);

    const optimisation = this.query.optimise(operation);

    return {
      operation,

      cacheAvailable: true,

      metric,

      optimisation,

      analysedAt: new Date(),
    };
  }
}
