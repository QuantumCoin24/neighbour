import { Injectable } from '@nestjs/common';

@Injectable()
export class DecisionService {

  create(
    signal: string,
  ) {

    return {
      signal,
      decision: 'review',
      createdAt: new Date(),
    };

  }

}
