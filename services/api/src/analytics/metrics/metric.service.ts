import { Injectable } from '@nestjs/common';

import type { MetricEntity } from './metric.entity';

@Injectable()
export class MetricService {
  private metrics: MetricEntity[] = [];

  update(metric: MetricEntity): MetricEntity {
    this.metrics.push(metric);

    return metric;
  }

  list(): MetricEntity[] {
    return this.metrics;
  }
}
