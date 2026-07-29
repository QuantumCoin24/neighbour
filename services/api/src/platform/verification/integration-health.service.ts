import { Injectable } from '@nestjs/common';

@Injectable()
export class IntegrationHealthService {

  score(
    systems: number,
  ) {

    return Math.min(
      systems * 20,
      100,
    );

  }

}
