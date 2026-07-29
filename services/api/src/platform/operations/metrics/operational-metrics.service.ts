import { Injectable } from '@nestjs/common';

@Injectable()
export class OperationalMetricsService {

  record(
    name: string,
    value: number,
  ) {

    return {
      name,
      value,
      recordedAt: new Date(),
    };

  }

}
