import { Injectable } from '@nestjs/common';


@Injectable()
export class AggregationService {

  count(
    values: unknown[],
  ): number {

    return values.length;
  }

}
