import { Injectable } from '@nestjs/common';

@Injectable()
export class TelemetryService {
  record(name: string, value: number) {
    return {
      name,

      value,

      recordedAt: new Date(),
    };
  }
}
