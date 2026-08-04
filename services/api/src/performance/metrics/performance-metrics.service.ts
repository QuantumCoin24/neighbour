import { Injectable } from '@nestjs/common';

@Injectable()
export class PerformanceMetricsService {
  record(name: string, value: number) {
    return {
      name,

      value,

      recordedAt: new Date(),
    };
  }
}
