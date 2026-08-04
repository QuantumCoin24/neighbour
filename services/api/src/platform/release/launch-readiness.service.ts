import { Injectable } from '@nestjs/common';

@Injectable()
export class LaunchReadinessService {
  check(launch: string) {
    return {
      launch,

      ready: launch === 'READY',

      checkedAt: new Date(),
    };
  }
}
