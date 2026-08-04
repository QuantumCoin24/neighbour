import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigurationReadinessService {
  check(configuration: string) {
    return {
      configuration,

      ready: configuration === 'READY',

      checkedAt: new Date(),
    };
  }
}
