import { Injectable } from '@nestjs/common';

@Injectable()
export class ResponseReadinessService {
  check(response: string) {
    return {
      response,

      ready: response === 'READY',

      checkedAt: new Date(),
    };
  }
}
