import { Injectable } from '@nestjs/common';

@Injectable()
export class JourneyStatusService {
  evaluate(name: string, status: string) {
    return {
      name,

      status,

      operational: status === 'READY',

      checkedAt: new Date(),
    };
  }
}
