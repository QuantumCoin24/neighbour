import { Injectable } from '@nestjs/common';

@Injectable()
export class PlatformControlReadinessService {
  check(control: string) {
    return {
      control,

      ready: control === 'READY',

      checkedAt: new Date(),
    };
  }
}
