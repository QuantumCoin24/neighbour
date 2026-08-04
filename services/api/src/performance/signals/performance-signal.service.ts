import { Injectable } from '@nestjs/common';

@Injectable()
export class PerformanceSignalService {
  record(operation: string, duration: number) {
    const status = duration < 200 ? 'FAST' : duration < 500 ? 'NORMAL' : 'SLOW';

    return {
      operation,

      duration,

      status,

      score: Math.max(0, 100 - Math.floor(duration / 10)),

      recordedAt: new Date(),
    };
  }
}
